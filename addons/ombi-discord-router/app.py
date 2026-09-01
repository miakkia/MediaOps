import json
import os
import threading
from pathlib import Path
from urllib.parse import urlencode

import requests
from flask import Flask, jsonify, request

APP_VERSION = "2.0-dev"

app = Flask(__name__)

MEDIA_REQUESTS_WEBHOOK = os.environ["MEDIA_REQUESTS_WEBHOOK"].strip()
MEDIA_REQUESTS_WEBHOOK_NAME = os.environ.get(
    "MEDIA_REQUESTS_WEBHOOK_NAME",
    "MediaOps Request Router",
).strip()

TAG_REQUESTED = os.environ["MEDIA_TAG_REQUESTED"].strip()
TAG_PROCESSING = os.environ["MEDIA_TAG_PROCESSING"].strip()
TAG_AVAILABLE = os.environ["MEDIA_TAG_AVAILABLE"].strip()
TAG_FAILED = os.environ["MEDIA_TAG_FAILED"].strip()
TAG_DENIED = os.environ["MEDIA_TAG_DENIED"].strip()
TAG_MOVIE = os.environ["MEDIA_TAG_MOVIE"].strip()
TAG_SERIES = os.environ["MEDIA_TAG_SERIES"].strip()
TAG_TEST = os.environ.get("MEDIA_TAG_TEST", "").strip()

DATA_DIR = Path(os.environ.get("ROUTER_DATA_DIR", "/data"))
INDEX_FILE = DATA_DIR / "media-threads.json"

index_lock = threading.Lock()

TERMINAL_STATUSES = {"available", "failed", "denied"}
STATUS_ORDER = {
    "requested": 0,
    "processing": 1,
    "available": 2,
    "failed": 2,
    "denied": 2,
}


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


def is_forward_status_transition(current, incoming):
    if current == incoming or current in TERMINAL_STATUSES:
        return False
    current_order = STATUS_ORDER.get(current)
    incoming_order = STATUS_ORDER.get(incoming)
    if current_order is None or incoming_order is None:
        return False
    return incoming_order > current_order


def is_new_request_instance(existing, data):
    old_request_id = str(existing.get("requestId") or "").strip()
    new_request_id = str(data.get("requestId") or "").strip()
    return bool(old_request_id and new_request_id and old_request_id != new_request_id)


def source_provider(data):
    value = str(data.get("sourceProvider") or "Ombi").strip()
    return value[:64] or "Provider"


def display_title(data):
    title = str(data.get("title") or "Media Request").strip()
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
    provider = source_provider(data)
    embed = {
        "title": display_title(data),
        "fields": [
            {"name": "Type", "value": "Series" if media_type == "series" else "Movie", "inline": True},
            {"name": "Status", "value": state.capitalize(), "inline": True},
            {"name": "Requested by", "value": str(requested_user(data))[:256], "inline": True},
            {"name": f"{provider} Request", "value": request_id[:256], "inline": True},
            {"name": "Provider ID", "value": provider_id[:256], "inline": True},
        ],
    }
    if overview:
        embed["description"] = overview[:1500]
    if poster.startswith(("https://", "http://")):
        embed["thumbnail"] = {"url": poster}
    return embed


def build_test_embed(provider="MediaOps"):
    provider = str(provider or "MediaOps").strip()[:64] or "MediaOps"
    return {
        "title": f"{provider} Webhook Test",
        "description": f"{provider} successfully reached the MediaOps Discord Router, and the router successfully delivered this test to the configured Discord Forum.",
        "fields": [
            {"name": "Status", "value": "OK", "inline": True},
            {"name": "Router", "value": f"v{APP_VERSION}", "inline": True},
        ],
    }


def webhook_url(**params):
    if not params:
        return MEDIA_REQUESTS_WEBHOOK
    separator = "&" if "?" in MEDIA_REQUESTS_WEBHOOK else "?"
    return f"{MEDIA_REQUESTS_WEBHOOK}{separator}{urlencode(params)}"


def discord_post(url, payload):
    response = requests.post(url, json=payload, timeout=15)
    if response.ok:
        return response
    body = response.text.strip().replace("\n", " ")[:300]
    suffix = f": {body}" if body else ""
    raise RuntimeError(f"Discord webhook returned HTTP {response.status_code}{suffix}")


def is_unknown_channel_error(error):
    message = str(error)
    return "HTTP 400" in message and ("Unknown Channel" in message or '"code": 10003' in message)


def create_test_forum_post(provider="Ombi"):
    if not TAG_TEST:
        return None
    provider = str(provider or "Provider").strip()[:64] or "Provider"
    payload = {
        "username": MEDIA_REQUESTS_WEBHOOK_NAME,
        "thread_name": f"{provider} Webhook Test"[:100],
        "applied_tags": [TAG_TEST],
        "embeds": [build_test_embed(provider)],
    }
    response = discord_post(webhook_url(wait="true"), payload)
    result = response.json()
    thread_id = str(result.get("channel_id") or "").strip()
    if not thread_id:
        raise RuntimeError("Discord did not return a Forum thread ID for webhook test")
    return thread_id


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
            "sourceProvider": source_provider(data),
        }
        save_index(index)
    return thread_id


def send_thread_update(thread_id, data, status):
    payload = {"username": MEDIA_REQUESTS_WEBHOOK_NAME, "embeds": [build_embed(data, status)]}
    discord_post(webhook_url(wait="true", thread_id=thread_id), payload)


def update_thread_tags(thread_id, media_type, status_tag):
    token = os.environ.get("DISCORD_BOT_TOKEN", "").strip()
    if not token:
        return
    payload = {"applied_tags": [media_tag(media_type), status_tag]}
    url = f"https://discord.com/api/v10/channels/{thread_id}"
    response = requests.patch(
        url,
        json=payload,
        timeout=15,
        headers={"Authorization": f"Bot {token}"},
    )
    if response.ok:
        return
    body = response.text.strip().replace("\n", " ")[:300]
    suffix = f": {body}" if body else ""
    raise RuntimeError(f"Discord tag update returned HTTP {response.status_code}{suffix}")


def process_media_notification(data):
    key = media_key(data)
    media_type = normalize_media_type(data.get("type"))
    if not key or not media_type:
        return {"status": "ignored", "reason": "missing-media-identity"}
    incoming_status, status_tag = status_from_payload(data)
    with index_lock:
        index = load_index()
        existing = index.get(key)

    # A provider/media ID identifies the title, not a permanent request lifecycle.
    # If Seerr/Ombi creates a fresh request ID for the same title, forget the old
    # terminal state/thread and allow the new lifecycle to create a new Forum post.
    if existing and is_new_request_instance(existing, data):
        with index_lock:
            index = load_index()
            index.pop(key, None)
            save_index(index)
        existing = None

    if not existing:
        thread_id = create_forum_post(data, key, incoming_status, status_tag)
        return {"status": "created", "threadId": thread_id, "mediaStatus": incoming_status}

    current_status = str(existing.get("status") or "requested")
    if not is_forward_status_transition(current_status, incoming_status):
        return {"status": "ignored", "reason": "non-forward-status", "mediaStatus": current_status}

    thread_id = str(existing.get("threadId") or "").strip()
    if not thread_id:
        with index_lock:
            index = load_index()
            index.pop(key, None)
            save_index(index)
        thread_id = create_forum_post(data, key, incoming_status, status_tag)
        return {"status": "recreated", "reason": "missing-thread", "threadId": thread_id, "mediaStatus": incoming_status}

    try:
        send_thread_update(thread_id, data, incoming_status)
    except RuntimeError as error:
        if not is_unknown_channel_error(error):
            raise
        with index_lock:
            index = load_index()
            index.pop(key, None)
            save_index(index)
        thread_id = create_forum_post(data, key, incoming_status, status_tag)
        return {"status": "recreated", "reason": "discord-thread-missing", "threadId": thread_id, "mediaStatus": incoming_status}

    update_thread_tags(thread_id, media_type, status_tag)
    with index_lock:
        index = load_index()
        current = index.get(key, {})
        current.update({
            "threadId": thread_id,
            "status": incoming_status,
            "requestId": data.get("requestId"),
            "providerId": data.get("providerId"),
            "sourceProvider": source_provider(data),
        })
        index[key] = current
        save_index(index)
    return {"status": "updated", "threadId": thread_id, "mediaStatus": incoming_status}


def log_notification_result(data, result):
    notification = str(data.get("notificationType") or "").strip()[:64] or "<empty>"
    status = str(result.get("status") or "").strip()[:64] or "unknown"
    reason = str(result.get("reason") or "").strip()[:64]
    suffix = f" reason={reason}" if reason else ""
    print(f"ROUTER EVENT: provider={source_provider(data)} notificationType={notification} result={status}{suffix}", flush=True)


@app.post("/ombi")
def ombi_webhook():
    data = request.get_json(silent=True)
    if not isinstance(data, dict) or not data:
        return jsonify({"error": "Invalid JSON"}), 400
    data["sourceProvider"] = "Ombi"
    notification_type = str(data.get("notificationType") or "").strip().upper()
    try:
        if notification_type in ("TEST_NOTIFICATION", "TEST"):
            thread_id = create_test_forum_post("Ombi")
            result = {"status": "created" if thread_id else "ok", "provider": "Ombi", "version": APP_VERSION}
            if thread_id:
                result["threadId"] = thread_id
            log_notification_result(data, result)
            return jsonify(result), 200
        result = process_media_notification(data)
        log_notification_result(data, result)
        return jsonify(result), 200
    except Exception as error:
        print(f"ROUTER ERROR: {type(error).__name__}: {error}", flush=True)
        return jsonify({"status": "error", "error": "Unable to deliver provider notification"}), 502
