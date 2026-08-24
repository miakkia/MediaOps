import json
import os
import threading
from pathlib import Path
from urllib.parse import urlencode

import requests
from flask import Flask, jsonify, request

APP_VERSION = "1.6"

app = Flask(__name__)

MEDIA_REQUESTS_WEBHOOK = os.environ["MEDIA_REQUESTS_WEBHOOK"].strip()
MEDIA_REQUESTS_WEBHOOK_NAME = os.environ.get(
    "MEDIA_REQUESTS_WEBHOOK_NAME",
    "Media Request Herald",
).strip()

TAG_REQUESTED = os.environ["MEDIA_TAG_REQUESTED"].strip()
TAG_PROCESSING = os.environ["MEDIA_TAG_PROCESSING"].strip()
TAG_AVAILABLE = os.environ["MEDIA_TAG_AVAILABLE"].strip()
TAG_FAILED = os.environ["MEDIA_TAG_FAILED"].strip()
TAG_DENIED = os.environ["MEDIA_TAG_DENIED"].strip()
TAG_MOVIE = os.environ["MEDIA_TAG_MOVIE"].strip()
TAG_SERIES = os.environ["MEDIA_TAG_SERIES"].strip()

DATA_DIR = Path(os.environ.get("ROUTER_DATA_DIR", "/data"))
INDEX_FILE = DATA_DIR / "media-threads.json"

index_lock = threading.Lock()


def load_index():
    if not INDEX_FILE.exists():
        return {}

    try:
        with INDEX_FILE.open("r", encoding="utf-8") as handle:
            value = json.load(handle)
    except (OSError, json.JSONDecodeError):
        return {}

    return value if isinstance(value, dict) else {}


def save_index(index):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    temp_file = INDEX_FILE.with_suffix(".tmp")

    with temp_file.open("w", encoding="utf-8") as handle:
        json.dump(index, handle, indent=2, ensure_ascii=False)
        handle.write("\n")

    temp_file.replace(INDEX_FILE)


def normalize_media_type(value):
    normalized = str(value or "").strip().lower()

    if normalized == "movie":
        return "movie"

    if normalized in ("tv show", "tvshow", "series", "tv"):
        return "series"

    return None


def media_key(data):
    media_type = normalize_media_type(data.get("type"))
    if not media_type:
        return None

    provider_id = str(data.get("providerId") or "").strip()
    if provider_id:
        return f"{media_type}:provider:{provider_id}"

    request_id = str(data.get("requestId") or "").strip()
    if request_id:
        return f"{media_type}:request:{request_id}"

    title = str(data.get("title") or "").strip().casefold()
    year = str(data.get("year") or "").strip()
    if title:
        return f"{media_type}:title:{title}:{year}"

    return None


def media_tag(media_type):
    return TAG_SERIES if media_type == "series" else TAG_MOVIE


def status_from_payload(data):
    notification = str(data.get("notificationType") or "").strip().lower()
    request_status = str(data.get("requestStatus") or "").strip().lower()

    combined = f"{notification} {request_status}"

    if "denied" in combined or "declined" in combined or "rejected" in combined:
        return "denied", TAG_DENIED

    if "failed" in combined or "error" in combined:
        return "failed", TAG_FAILED

    if "available" in combined:
        return "available", TAG_AVAILABLE

    if any(value in combined for value in ("approved", "processing", "in progress")):
        return "processing", TAG_PROCESSING

    return "requested", TAG_REQUESTED


def display_title(data):
    title = str(data.get("title") or "Ombi Request").strip()
    year = str(data.get("year") or "").strip()
    return f"{title} ({year})" if year else title


def requested_user(data):
    return (
        data.get("requestedByAlias")
        or data.get("requestedUser")
        or data.get("alias")
        or data.get("userName")
        or "Unknown"
    )


def build_embed(data, state):
    media_type = normalize_media_type(data.get("type")) or "unknown"
    overview = str(data.get("overview") or "").strip()
    poster = str(data.get("posterImage") or "").strip()
    request_id = str(data.get("requestId") or "").strip() or "—"
    provider_id = str(data.get("providerId") or "").strip() or "—"

    embed = {
        "title": display_title(data),
        "fields": [
            {
                "name": "Type",
                "value": "Series" if media_type == "series" else "Movie",
                "inline": True,
            },
            {
                "name": "Status",
                "value": state.capitalize(),
                "inline": True,
            },
            {
                "name": "Requested by",
                "value": str(requested_user(data))[:256],
                "inline": True,
            },
            {
                "name": "Ombi Request",
                "value": request_id[:256],
                "inline": True,
            },
            {
                "name": "Provider ID",
                "value": provider_id[:256],
                "inline": True,
            },
        ],
    }

    if overview:
        embed["description"] = overview[:1500]

    if poster.startswith(("https://", "http://")):
        embed["thumbnail"] = {"url": poster}

    return embed


def webhook_url(**params):
    if not params:
        return MEDIA_REQUESTS_WEBHOOK

    separator = "&" if "?" in MEDIA_REQUESTS_WEBHOOK else "?"
    return f"{MEDIA_REQUESTS_WEBHOOK}{separator}{urlencode(params)}"


def discord_post(url, payload):
    response = requests.post(url, json=payload, timeout=15)

    if response.ok:
        return response

    # Never include the webhook URL in raised/logged errors because it contains
    # the Discord webhook credential.
    body = response.text.strip().replace("\n", " ")[:300]
    suffix = f": {body}" if body else ""
    raise RuntimeError(f"Discord webhook returned HTTP {response.status_code}{suffix}")


def create_forum_post(data, key, status, status_tag):
    media_type = normalize_media_type(data.get("type"))

    payload = {
        "username": MEDIA_REQUESTS_WEBHOOK_NAME,
        "thread_name": display_title(data)[:100],
        "applied_tags": [media_tag(media_type), status_tag],
        "embeds": [build_embed(data, status)],
    }

    response = discord_post(webhook_url(wait="true"), payload)
    result = response.json()

    thread_id = str(result.get("channel_id") or "").strip()
    message_id = str(result.get("id") or "").strip()

    if not thread_id:
        raise RuntimeError("Discord did not return a Forum thread ID")

    with index_lock:
        index = load_index()
        index[key] = {
            "threadId": thread_id,
            "messageId": message_id,
            "title": display_title(data),
            "type": media_type,
            "status": status,
            "requestId": data.get("requestId"),
            "providerId": data.get("providerId"),
        }
        save_index(index)

    return thread_id


def send_thread_update(thread_id, data, status):
    payload = {
        "username": MEDIA_REQUESTS_WEBHOOK_NAME,
        "embeds": [build_embed(data, status)],
    }

    discord_post(
        webhook_url(wait="true", thread_id=thread_id),
        payload,
    )


def process_media_notification(data):
    media_type = normalize_media_type(data.get("type"))

    if not media_type:
        return {
            "status": "ignored",
            "reason": "unsupported-media-type",
        }

    key = media_key(data)
    if not key:
        return {
            "status": "ignored",
            "reason": "missing-media-identity",
        }

    status, status_tag = status_from_payload(data)

    with index_lock:
        index = load_index()
        existing = index.get(key)

    if not existing:
        thread_id = create_forum_post(
            data,
            key,
            status,
            status_tag,
        )

        return {
            "status": "created",
            "mediaKey": key,
            "threadId": thread_id,
            "requestStatus": status,
        }

    thread_id = str(existing.get("threadId") or "").strip()
    if not thread_id:
        raise RuntimeError(f"Stored media entry {key} has no threadId")

    send_thread_update(thread_id, data, status)

    with index_lock:
        index = load_index()
        current = index.get(key)

        if current:
            current["status"] = status

            if data.get("requestId"):
                current["requestId"] = data.get("requestId")

            if data.get("providerId"):
                current["providerId"] = data.get("providerId")

            save_index(index)

    return {
        "status": "updated",
        "mediaKey": key,
        "threadId": thread_id,
        "requestStatus": status,
    }


@app.post("/ombi")
def ombi_webhook():
    data = request.get_json(silent=True)

    if not isinstance(data, dict) or not data:
        return jsonify({"error": "Invalid JSON"}), 400

    notification_type = str(data.get("notificationType") or "").strip().lower()

    if notification_type == "test":
        return jsonify({
            "status": "ok",
            "mode": "discord-forum",
            "version": APP_VERSION,
            "note": "Ombi test payload accepted; no Forum post created.",
        }), 200

    if notification_type == "requestdeleted":
        return jsonify({
            "status": "ignored",
            "reason": "request-deleted",
        }), 200

    try:
        result = process_media_notification(data)
        return jsonify(result), 200
    except Exception as error:  # noqa: BLE001 - route boundary intentionally sanitizes logs
        print(
            f"ROUTER ERROR: {type(error).__name__}: {error}",
            flush=True,
        )
        return jsonify({
            "status": "error",
            "error": "Unable to deliver Ombi notification",
        }), 502


@app.get("/health")
def health():
    return jsonify({
        "status": "ok",
        "version": APP_VERSION,
        "mode": "discord-forum",
        "index": str(INDEX_FILE),
    }), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
