"""
TikTok API v2 – Intégration propre pour Collabzz
OAuth + récupération des statistiques utilisateur
"""

import os
import requests
from urllib.parse import urlencode
from datetime import datetime, timedelta
from typing import Optional
from firebase_admin import firestore
from lib.token_store import save_tokens

# ========================
# CONFIGURATION
# ========================

TIKTOK_CLIENT_KEY = os.getenv("TIKTOK_CLIENT_KEY")
TIKTOK_CLIENT_SECRET = os.getenv("TIKTOK_CLIENT_SECRET")
TIKTOK_REDIRECT_URI = os.getenv("TIKTOK_REDIRECT_URI")

TIKTOK_AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/"
TIKTOK_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/"
TIKTOK_USER_INFO_URL = "https://open.tiktokapis.com/v2/user/info/"
TIKTOK_VIDEO_LIST_URL = "https://open.tiktokapis.com/v2/video/list/"
TIKTOK_USER_BASIC_FIELDS = "open_id,union_id,display_name,avatar_url"
TIKTOK_USER_STATS_FIELDS = "follower_count,following_count,likes_count,video_count"
TIKTOK_USER_FIELDS = f"{TIKTOK_USER_BASIC_FIELDS},{TIKTOK_USER_STATS_FIELDS}"


def _fetch_user_info(access_token: str, fields: str) -> dict:
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(
        TIKTOK_USER_INFO_URL,
        headers=headers,
        params={"fields": fields},
        timeout=20
    )
    response.raise_for_status()
    return response.json().get("data", {}).get("user", {})


def _get_tiktok_user_with_fallback(access_token: str) -> tuple[dict, bool]:
    try:
        return _fetch_user_info(access_token, TIKTOK_USER_FIELDS), True
    except requests.HTTPError as exc:
        status_code = exc.response.status_code if exc.response is not None else None
        if status_code not in (401, 403):
            raise

    basic_user = _fetch_user_info(access_token, TIKTOK_USER_BASIC_FIELDS)
    return basic_user, False


def _to_int(value) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return 0


def _fetch_tiktok_avg_views(access_token: str, max_count: int = 20) -> tuple[Optional[int], Optional[int], int, bool]:
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(
            TIKTOK_VIDEO_LIST_URL,
            headers=headers,
            params={"fields": "id,view_count"},
            json={"max_count": max_count},
            timeout=20
        )
        response.raise_for_status()
    except requests.HTTPError as exc:
        status_code = exc.response.status_code if exc.response is not None else None
        if status_code in (401, 403):
            return None, None, 0, False
        return None, None, 0, False
    except requests.RequestException:
        return None, None, 0, False

    payload = response.json() or {}
    videos = (payload.get("data") or {}).get("videos") or []

    view_values = [_to_int(video.get("view_count")) for video in videos]
    view_values = [value for value in view_values if value >= 0]

    if not view_values:
        return None, None, 0, True

    total_views = sum(view_values)
    avg_views = round(total_views / len(view_values))
    return total_views, avg_views, len(view_values), True

# ========================
# OAUTH – CONNEXION
# ========================

def connect_tiktok(user_id: str, state_token: str) -> str:
    scopes = [
        "user.info.basic",
        "user.info.stats",
        "video.list"
    ]

    params = {
        "client_key": TIKTOK_CLIENT_KEY,
        "response_type": "code",
        "scope": ",".join(scopes),
        "redirect_uri": TIKTOK_REDIRECT_URI,
        "state": state_token
    }

    return f"{TIKTOK_AUTH_URL}?{urlencode(params)}"


# ========================
# CALLBACK OAUTH
# ========================

def tiktok_callback(code: str, user_id: str) -> dict:
    token_payload = {
        "client_key": TIKTOK_CLIENT_KEY,
        "client_secret": TIKTOK_CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": TIKTOK_REDIRECT_URI
    }

    token_res = requests.post(
        TIKTOK_TOKEN_URL,
        data=token_payload,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    token_res.raise_for_status()
    token = token_res.json()

    access_token = token.get("access_token")
    refresh_token = token.get("refresh_token")
    expires_in = token.get("expires_in", 3600)
    open_id = token.get("open_id")

    if not access_token:
        raise Exception(f"Token TikTok invalide : {token}")

    # ========================
    # RÉCUPÉRATION PROFIL + STATS (avec fallback)
    # ========================

    user, has_stats_access = _get_tiktok_user_with_fallback(access_token)

    followers = int(user.get("follower_count", 0) or 0)
    following = int(user.get("following_count", 0) or 0)
    likes = int(user.get("likes_count", 0) or 0)
    videos = int(user.get("video_count", 0) or 0)
    username = user.get("display_name") or ""
    avatar_url = user.get("avatar_url") or ""
    total_views, avg_views, sampled_videos, has_video_list_access = _fetch_tiktok_avg_views(access_token)

    # ========================
    # SAUVEGARDE FIRESTORE
    # ========================

    db = firestore.client()
    db.collection("influencers").document(user_id).update({
        "socialAccounts.tiktok": {
            "connected": True,
            "openId": open_id,
            "username": username,
            "avatarUrl": avatar_url,
            "followers": followers,
            "following": following,
            "likes": likes,
            "videoCount": videos,
            "views": total_views,
            "avgViews": avg_views,
            "sampledVideos": sampled_videos,
            "statsAccess": has_stats_access,
            "videoListAccess": has_video_list_access,
            "lastUpdated": firestore.SERVER_TIMESTAMP
        }
    })

    expires_at = datetime.utcnow() + timedelta(seconds=expires_in)

    save_tokens(user_id, "tiktok", {
        "accessToken": access_token,
        "refreshToken": refresh_token,
        "expiresAt": expires_at,
        "createdAt": firestore.SERVER_TIMESTAMP
    })

    return {
        "success": True,
        "username": username,
        "followers": followers,
        "following": following,
        "likes": likes,
        "videoCount": videos,
        "views": total_views,
        "avgViews": avg_views,
        "sampledVideos": sampled_videos,
        "statsAccess": has_stats_access,
        "videoListAccess": has_video_list_access
    }


# ========================
# UPDATE STATS (CRON)
# ========================

def update_tiktok_stats(user_id: str, tokens: dict) -> dict:
    access_token = tokens["accessToken"]
    refresh_token = tokens["refreshToken"]
    expires_at = tokens["expiresAt"]

    # Rafraîchir le token si nécessaire
    if datetime.utcnow() >= expires_at.replace(tzinfo=None):
        refresh_payload = {
            "client_key": TIKTOK_CLIENT_KEY,
            "client_secret": TIKTOK_CLIENT_SECRET,
            "grant_type": "refresh_token",
            "refresh_token": refresh_token
        }

        refresh_res = requests.post(
            TIKTOK_TOKEN_URL,
            data=refresh_payload,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        refresh_res.raise_for_status()
        refreshed = refresh_res.json()

        access_token = refreshed["access_token"]
        refresh_token = refreshed["refresh_token"]
        expires_at = datetime.utcnow() + timedelta(
            seconds=refreshed["expires_in"]
        )

        save_tokens(user_id, "tiktok", {
            "accessToken": access_token,
            "refreshToken": refresh_token,
            "expiresAt": expires_at,
            "updatedAt": firestore.SERVER_TIMESTAMP
        })

    # Récupération profil/stats avec fallback
    user, has_stats_access = _get_tiktok_user_with_fallback(access_token)
    total_views, avg_views, sampled_videos, has_video_list_access = _fetch_tiktok_avg_views(access_token)

    db = firestore.client()
    db.collection("influencers").document(user_id).update({
        "socialAccounts.tiktok.username": user.get("display_name") or "",
        "socialAccounts.tiktok.avatarUrl": user.get("avatar_url") or "",
        "socialAccounts.tiktok.followers": int(user.get("follower_count", 0) or 0),
        "socialAccounts.tiktok.following": int(user.get("following_count", 0) or 0),
        "socialAccounts.tiktok.likes": int(user.get("likes_count", 0) or 0),
        "socialAccounts.tiktok.videoCount": int(user.get("video_count", 0) or 0),
        "socialAccounts.tiktok.views": total_views,
        "socialAccounts.tiktok.avgViews": avg_views,
        "socialAccounts.tiktok.sampledVideos": sampled_videos,
        "socialAccounts.tiktok.statsAccess": has_stats_access,
        "socialAccounts.tiktok.videoListAccess": has_video_list_access,
        "socialAccounts.tiktok.lastUpdated": firestore.SERVER_TIMESTAMP
    })

    return {
        "success": True,
        "statsAccess": has_stats_access,
        "videoListAccess": has_video_list_access,
        "avgViews": avg_views,
        "sampledVideos": sampled_videos
    }
