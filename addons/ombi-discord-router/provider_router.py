import re

from flask import jsonify, request

from app import (
    APP_VERSION,
    app,
    create_test_forum_post,
    process_media_notification,
)


def _dict(value):
    return value if isinstance(value, dict) else {}


def _text(value):
    return str(value or "").strip()


def _subject_title_year(subject):
    value = _text(subject)
    match = re.match(r"^(.*)\s+\((\d{4})\)$", value)
    if not match:
        return value, ""
    return match.group(1).strip(), match.group(2)


def normalize_seerr_payload(payload):
    """Translate Seerr's generic webhook payload into the router's canonical shape."""
    media = _dict(payload.get("media"))
    req = _dict(payload.get("request"))
    subject_title, subject_year = _subject_title_year(payload.get("subject"))

    raw_type = _text(media.get("media_type") or media.get("mediaType")).lower()
    media_type = "Movie" if raw_type == "movie" else "TV Show" if raw_type in ("tv", "series") else raw_type

    notification = _text(payload.get("notification_type") or payload.get("notificationType"))
    request_status = _text(media.get("status") or payload.get("event"))

    requested_by = (
        req.get("requestedBy_username")
        or req.get("requestedByUsername")
        or req.get("requested_by_username")
        or req.get("requestedBy_email")
        or req.get("requestedByEmail")
        or req.get("requested_by_email")
        or "Unknown"
    )

    return {
        "sourceProvider": "Seerr",
        "notificationType": notification,
        "requestStatus": request_status,
        "type": media_type,
        "title": subject_title or _text(payload.get("subject")) or "Seerr Request",
        "year": subject_year,
        "overview": _text(payload.get("message")),
        "posterImage": _text(payload.get("image")),
        "requestId": req.get("request_id") or req.get("requestId"),
        "providerId": media.get("tmdbId") or media.get("tmdb_id") or media.get("tvdbId") or media.get("tvdb_id"),
        "requestedUser": requested_by,
    }


def _log_seerr_result(data, result):
    notification = _text(data.get("notification_type") or data.get("notificationType"))[:64] or "<empty>"
    status = _text(result.get("status"))[:64] or "unknown"
    reason = _text(result.get("reason"))[:64]
    suffix = f" reason={reason}" if reason else ""
    print(f"ROUTER EVENT: provider=Seerr notificationType={notification} result={status}{suffix}", flush=True)


@app.post("/seerr")
def seerr_webhook():
    data = request.get_json(silent=True)
    if not isinstance(data, dict) or not data:
        return jsonify({"error": "Invalid JSON"}), 400

    notification_type = _text(data.get("notification_type") or data.get("notificationType")).upper()

    try:
        if notification_type in ("TEST_NOTIFICATION", "TEST"):
            thread_id = create_test_forum_post("Seerr")
            result = {
                "status": "created" if thread_id else "ok",
                "mode": "discord-forum-test" if thread_id else "discord-forum",
                "provider": "Seerr",
                "version": APP_VERSION,
            }
            if thread_id:
                result["threadId"] = thread_id
            _log_seerr_result(data, result)
            return jsonify(result), 200

        normalized = normalize_seerr_payload(data)
        result = process_media_notification(normalized)
        _log_seerr_result(data, result)
        return jsonify(result), 200
    except Exception as error:  # route boundary intentionally sanitizes response
        print(f"ROUTER ERROR: {type(error).__name__}: {error}", flush=True)
        return jsonify({"status": "error", "error": "Unable to deliver provider notification"}), 502


# Keep the existing Ombi route from app.py. This module only adds provider adapters.
