import json
import os
import re
import threading
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlencode, urljoin, urlparse

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
# Serializes the complete request lifecycle (webhooks + reconciliation). The
# packaged Router intentionally runs one Gunicorn worker, so this prevents a
# webhook and the Ombi reconciliation thread from creating the same Forum
# thread concurrently.
lifecycle_lock = threading.Lock()

OMBI_RECONCILE_ENABLED = os.environ.get("OMBI_RECONCILE_ENABLED", "false").strip().lower() in ("1", "true", "yes", "on")
OMBI_RECONCILE_URL = os.environ.get("OMBI_RECONCILE_URL", "").strip()
OMBI_RECONCILE_API_KEY = os.environ.get("OMBI_RECONCILE_API_KEY", "").strip()
OMBI_RECONCILE_INTERVAL_SECONDS = max(300, int(os.environ.get("OMBI_RECONCILE_INTERVAL_SECONDS", "900")))
OMBI_RECONCILE_LOOKBACK_HOURS = max(1, int(os.environ.get("OMBI_RECONCILE_LOOKBACK_HOURS", "168")))

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


def canonical_title(value):
    text = str(value or "").strip().casefold()
    text = re.sub(r"\s*\((?:19|20)\d{2}\)\s*$", "", text)
    return " ".join(text.split())


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


def discord_thread_exists(thread_id):
    """Return True/False only when Discord gives a definitive answer; None is fail-safe unknown."""
    token = os.environ.get("DISCORD_BOT_TOKEN", "").strip()
    thread_id = str(thread_id or "").strip()
    if not token or not thread_id:
        return None
    try:
        response = requests.get(
            f"https://discord.com/api/v10/channels/{thread_id}",
            headers={"Authorization": f"Bot {token}"},
            timeout=15,
            allow_redirects=False,
        )
    except requests.RequestException:
        return None
    if response.status_code == 200:
        return True
    if response.status_code == 404:
        try:
            payload = response.json()
        except ValueError:
            return None
        # Discord error 10003 is the definitive Unknown Channel response.
        return False if payload.get("code") == 10003 else None
    return None


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


def _same_value(left, right):
    left_value = str(left or "").strip()
    right_value = str(right or "").strip()
    return bool(left_value and right_value and left_value == right_value)


def request_matches(existing, data):
    provider = source_provider(data).casefold()
    media_type = normalize_media_type(data.get("type"))
    if str(existing.get("sourceProvider") or "Ombi").casefold() != provider:
        return False
    if media_type and existing.get("type") != media_type:
        return False
    if _same_value(existing.get("requestId"), data.get("requestId")):
        return True
    if _same_value(existing.get("providerId"), data.get("providerId")):
        return True
    incoming_title = canonical_title(data.get("title") or display_title(data))
    existing_title = canonical_title(existing.get("title"))
    return bool(incoming_title and existing_title and incoming_title == existing_title)


def find_existing_request(index, data, preferred_key):
    direct = index.get(preferred_key)
    if direct:
        return preferred_key, direct
    for existing_key, existing in index.items():
        if request_matches(existing, data):
            return existing_key, existing
    return preferred_key, None


def remove_index_entry(key):
    with index_lock:
        index = load_index()
        removed = index.pop(key, None)
        if removed is not None:
            save_index(index)
        return removed


def remove_matching_entries(data):
    with index_lock:
        index = load_index()
        matched = [key for key, existing in index.items() if request_matches(existing, data)]
        removed = [index.pop(key) for key in matched]
        if matched:
            save_index(index)
        return removed


def process_request_deleted(data):
    removed = remove_matching_entries(data)
    if not removed:
        return {"status": "ignored", "reason": "request-deleted-untracked"}
    return {
        "status": "removed",
        "reason": "request-deleted",
        "removedCount": len(removed),
        "threadId": str(removed[0].get("threadId") or ""),
    }


def _process_media_notification(data):
    preferred_key = media_key(data)
    media_type = normalize_media_type(data.get("type"))
    if not preferred_key or not media_type:
        return {"status": "ignored", "reason": "missing-media-identity"}
    incoming_status, status_tag = status_from_payload(data)
    notification_type = str(data.get("notificationType") or "").strip().upper()
    with index_lock:
        index = load_index()
        key, existing = find_existing_request(index, data, preferred_key)

    if existing:
        current_status = str(existing.get("status") or "requested").strip().lower()

        # Ombi's NewRequest event is the authoritative start of a fresh lifecycle.
        # If stale terminal state survived a delete event (or an older router build),
        # clear every correlated record and allow the same title to be requested again.
        # During an active lifecycle NewRequest remains a duplicate and does not fork
        # a second Discord Forum post.
        if source_provider(data).casefold() == "ombi" and notification_type == "NEWREQUEST" and current_status in TERMINAL_STATUSES:
            remove_matching_entries(data)
            key = preferred_key
            existing = None
        elif is_new_request_instance(existing, data) and current_status in TERMINAL_STATUSES:
            remove_matching_entries(data)
            key = preferred_key
            existing = None

    if not existing:
        thread_id = create_forum_post(data, key, incoming_status, status_tag)
        return {"status": "created", "threadId": thread_id, "mediaStatus": incoming_status}

    current_status = str(existing.get("status") or "requested").strip().lower()
    thread_id = str(existing.get("threadId") or "").strip()

    # Reconciliation also validates the persisted Discord correlation. Recreate
    # only when Discord definitively confirms Unknown Channel (404/code 10003).
    # Authentication, rate-limit, network, and server errors are intentionally
    # treated as unknown so an outage can never cause duplicate Forum threads.
    if notification_type == "RECONCILIATION" and thread_id:
        exists = discord_thread_exists(thread_id)
        if exists is False:
            remove_index_entry(key)
            thread_id = create_forum_post(data, preferred_key, incoming_status, status_tag)
            return {"status": "recreated", "reason": "discord-thread-confirmed-missing", "threadId": thread_id, "mediaStatus": incoming_status}

    if not is_forward_status_transition(current_status, incoming_status):
        return {"status": "ignored", "reason": "non-forward-status", "mediaStatus": current_status}

    if not thread_id:
        remove_index_entry(key)
        thread_id = create_forum_post(data, preferred_key, incoming_status, status_tag)
        return {"status": "recreated", "reason": "missing-thread", "threadId": thread_id, "mediaStatus": incoming_status}

    try:
        send_thread_update(thread_id, data, incoming_status)
    except RuntimeError as error:
        if not is_unknown_channel_error(error):
            raise
        remove_index_entry(key)
        thread_id = create_forum_post(data, preferred_key, incoming_status, status_tag)
        return {"status": "recreated", "reason": "discord-thread-missing", "threadId": thread_id, "mediaStatus": incoming_status}

    update_thread_tags(thread_id, media_type, status_tag)
    with index_lock:
        index = load_index()
        current = index.get(key, {})
        current.update({
            "threadId": thread_id,
            "status": incoming_status,
            "requestId": data.get("requestId") or current.get("requestId"),
            "providerId": data.get("providerId") or current.get("providerId"),
            "sourceProvider": source_provider(data),
            "title": display_title(data),
            "type": media_type,
        })
        index[key] = current
        save_index(index)
    return {"status": "updated", "threadId": thread_id, "mediaStatus": incoming_status}


def process_media_notification(data):
    # Keep the entire read/check/create-or-update transaction serialized.
    # create_forum_post() only writes the index after Discord confirms creation,
    # so holding this separate lifecycle lock across the network operation is
    # what closes the duplicate-thread race.
    with lifecycle_lock:
        return _process_media_notification(data)


def _parse_ombi_date(value):
    text = str(value or "").strip()
    if not text:
        return None
    try:
        parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _within_reconcile_window(row):
    requested = _parse_ombi_date(row.get("requestedDate"))
    if requested is None:
        # Fail closed for unknown/legacy shapes: do not flood Discord with an
        # unbounded historical request set.
        return False
    cutoff = datetime.now(timezone.utc) - timedelta(hours=OMBI_RECONCILE_LOOKBACK_HOURS)
    return requested >= cutoff


def _ombi_requested_user(row):
    user = row.get("requestedUser")
    if isinstance(user, dict):
        return (
            user.get("userAlias")
            or user.get("userName")
            or user.get("username")
            or user.get("emailAddress")
            or row.get("requestedByAlias")
            or "Unknown"
        )
    return row.get("requestedByAlias") or "Unknown"


def _ombi_flag(value):
    # Ombi payloads can expose booleans as JSON booleans, numeric flags, or
    # strings. Never use bool("false"), which is True in Python.
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value == 1
    if isinstance(value, str):
        return value.strip().casefold() in ("true", "1", "yes", "on")
    return False


def _ombi_request_status(row):
    # Availability is authoritative for reconciliation. If Ombi knows the media
    # is present on the configured media server (the UI can offer "Play on
    # Emby"), Available must win over stale approval/denial lifecycle flags.
    if _ombi_flag(row.get("available")) or _ombi_flag(row.get("markedAsAvailable")):
        return "available"
    if _ombi_flag(row.get("denied")) or _ombi_flag(row.get("markedAsDenied")):
        return "denied"
    if _ombi_flag(row.get("approved")) or _ombi_flag(row.get("markedAsApproved")):
        return "approved"
    return "requested"


def _release_year(row):
    value = str(row.get("releaseDate") or "").strip()
    return value[:4] if len(value) >= 4 and value[:4].isdigit() else ""


def _ombi_poster_image(*rows):
    # Ombi request responses vary by media type/version. Reuse an absolute
    # poster/image URL when the request API already provides one; never invent
    # a third-party URL or leak the Ombi API key into an image URL.
    for row in rows:
        if not isinstance(row, dict):
            continue
        for key in ("posterImage", "posterUrl", "poster", "image", "imageUrl"):
            value = str(row.get(key) or "").strip()
            if value.startswith(("https://", "http://")):
                return value
    return ""


def _normalize_ombi_movie(row):
    if not isinstance(row, dict) or not _within_reconcile_window(row):
        return None
    request_id = row.get("id")
    if request_id is None:
        return None
    return {
        "sourceProvider": "Ombi",
        "notificationType": "Reconciliation",
        "requestStatus": _ombi_request_status(row),
        "type": "Movie",
        "title": row.get("title") or "Ombi Movie Request",
        "year": _release_year(row),
        "requestId": request_id,
        "providerId": row.get("theMovieDbId") or row.get("imdbId"),
        "requestedUser": _ombi_requested_user(row),
        "posterImage": _ombi_poster_image(row),
    }


def _normalize_ombi_tv(parent, child):
    if not isinstance(parent, dict) or not isinstance(child, dict) or not _within_reconcile_window(child):
        return None
    request_id = child.get("id")
    if request_id is None:
        return None
    return {
        "sourceProvider": "Ombi",
        "notificationType": "Reconciliation",
        "requestStatus": _ombi_request_status(child),
        "type": "TV Show",
        "title": parent.get("title") or child.get("title") or "Ombi TV Request",
        "year": _release_year(parent),
        "requestId": request_id,
        "providerId": parent.get("tvDbId") or parent.get("externalProviderId") or parent.get("imdbId"),
        "requestedUser": _ombi_requested_user(child),
        "posterImage": _ombi_poster_image(child, parent),
    }


def _ombi_api_get(path):
    if not OMBI_RECONCILE_URL or not OMBI_RECONCILE_API_KEY:
        raise RuntimeError("Ombi reconciliation credentials are not configured")
    base = OMBI_RECONCILE_URL.rstrip("/") + "/"
    parsed = urlparse(base)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise RuntimeError("OMBI_RECONCILE_URL must be a valid http(s) URL")
    response = requests.get(
        urljoin(base, path.lstrip("/")),
        headers={"ApiKey": OMBI_RECONCILE_API_KEY, "Accept": "application/json"},
        timeout=15,
        allow_redirects=False,
    )
    if not response.ok:
        raise RuntimeError(f"Ombi reconciliation returned HTTP {response.status_code}")
    try:
        payload = response.json()
    except ValueError as error:
        raise RuntimeError("Ombi reconciliation returned invalid JSON") from error
    if not isinstance(payload, list):
        raise RuntimeError("Ombi reconciliation returned an unexpected response shape")
    return payload


def reconcile_ombi_requests():
    movies = _ombi_api_get("/api/v1/Request/movie")
    tv_rows = _ombi_api_get("/api/v1/Request/tv")
    candidates = []
    for row in movies:
        normalized = _normalize_ombi_movie(row)
        if normalized:
            candidates.append(normalized)
    for parent in tv_rows:
        if not isinstance(parent, dict):
            continue
        for child in parent.get("childRequests") or []:
            normalized = _normalize_ombi_tv(parent, child)
            if normalized:
                candidates.append(normalized)

    created = 0
    updated = 0
    ignored = 0
    for data in candidates:
        result = process_media_notification(data)
        status = result.get("status")
        if status in ("created", "recreated"):
            created += 1
        elif status == "updated":
            updated += 1
        else:
            ignored += 1
    print(
        f"ROUTER RECONCILE: provider=Ombi checked={len(candidates)} created={created} updated={updated} ignored={ignored}",
        flush=True,
    )


def ombi_reconcile_loop():
    if not OMBI_RECONCILE_ENABLED:
        return
    if not OMBI_RECONCILE_URL or not OMBI_RECONCILE_API_KEY:
        print("ROUTER RECONCILE: provider=Ombi disabled reason=missing-configuration", flush=True)
        return
    while True:
        try:
            reconcile_ombi_requests()
        except Exception as error:
            # Never log URLs, API keys, response bodies, or request payloads.
            print(f"ROUTER RECONCILE ERROR: provider=Ombi type={type(error).__name__} message={error}", flush=True)
        time.sleep(OMBI_RECONCILE_INTERVAL_SECONDS)


def start_ombi_reconciler():
    if not OMBI_RECONCILE_ENABLED:
        return
    thread = threading.Thread(target=ombi_reconcile_loop, name="ombi-reconciler", daemon=True)
    thread.start()


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
        if notification_type == "REQUESTDELETED":
            result = process_request_deleted(data)
            log_notification_result(data, result)
            return jsonify(result), 200
        result = process_media_notification(data)
        log_notification_result(data, result)
        return jsonify(result), 200
    except Exception as error:
        print(f"ROUTER ERROR: {type(error).__name__}: {error}", flush=True)
        return jsonify({"status": "error", "error": "Unable to deliver provider notification"}), 502
