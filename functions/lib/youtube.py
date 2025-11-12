"""
Intégration YouTube pour Collabzz
Gestion de l'OAuth et récupération des statistiques
"""

import os
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from firebase_admin import firestore
from datetime import datetime, timezone
from lib.token_store import save_tokens

# Configuration YouTube OAuth
YOUTUBE_CLIENT_ID = os.getenv('YOUTUBE_CLIENT_ID')
YOUTUBE_CLIENT_SECRET = os.getenv('YOUTUBE_CLIENT_SECRET')
YOUTUBE_REDIRECT_URI = os.getenv('YOUTUBE_REDIRECT_URI')

SCOPES = ['https://www.googleapis.com/auth/youtube.readonly']


def get_oauth_flow():
    """Créer le flow OAuth pour YouTube"""
    client_config = {
        "web": {
            "client_id": YOUTUBE_CLIENT_ID,
            "client_secret": YOUTUBE_CLIENT_SECRET,
            "redirect_uris": [YOUTUBE_REDIRECT_URI],
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token"
        }
    }
    
    flow = Flow.from_client_config(
        client_config,
        scopes=SCOPES,
        redirect_uri=YOUTUBE_REDIRECT_URI
    )
    return flow


def connect_youtube(user_id: str, state_token: str) -> str:
    """
    Génère l'URL d'autorisation YouTube
    
    Args:
        user_id: ID de l'utilisateur Firebase
        
    Returns:
        URL d'autorisation OAuth
    """
    flow = get_oauth_flow()
    authorization_url, _ = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        state=state_token,
        prompt='consent'  # Force refresh token
    )
    
    return authorization_url


def youtube_callback(code: str, user_id: str):
    """
    Gère le callback OAuth YouTube et stocke les tokens dans Firestore
    """
    print(f"[YouTube Callback] Début pour user_id: {user_id}")
    
    try:
        # Échanger le code contre des tokens
        flow = get_oauth_flow()
        print("[YouTube Callback] Flow créé, échange du code...")
        flow.fetch_token(code=code)
        credentials = flow.credentials
        print("[YouTube Callback] Tokens récupérés avec succès")
        
        # Créer le client YouTube
        youtube = build('youtube', 'v3', credentials=credentials)
        print("[YouTube Callback] Client YouTube créé")
        
        # Récupérer les infos du canal
        request = youtube.channels().list(
            part='snippet,statistics,contentDetails',
            mine=True
        )
        print("[YouTube Callback] Exécution de la requête channels().list()...")
        response = request.execute()
        print(f"[YouTube Callback] Réponse reçue: {response}")
        
        # Vérifier que la réponse contient des items
        if 'items' not in response or not response['items']:
            raise Exception(f"Aucun canal YouTube trouvé. Réponse API: {response}")
        
        channel = response['items'][0]
        channel_id = channel['id']
        channel_title = channel['snippet']['title']
        channel_thumbnail = channel['snippet']['thumbnails']['default']['url']
        
        # Statistiques
        stats = channel['statistics']
        subscribers = int(stats.get('subscriberCount', 0))
        video_count = int(stats.get('videoCount', 0))
        view_count = int(stats.get('viewCount', 0))
        
        # Récupérer les 6 dernières vidéos
        uploads_playlist_id = channel['contentDetails']['relatedPlaylists']['uploads']
        
        videos_request = youtube.playlistItems().list(
            part='snippet,contentDetails',
            playlistId=uploads_playlist_id,
            maxResults=6
        )
        videos_response = videos_request.execute()
        
        # Récupérer les stats de chaque vidéo
        video_ids = [item['contentDetails']['videoId'] for item in videos_response['items']]
        
        videos_stats_request = youtube.videos().list(
            part='statistics,snippet',
            id=','.join(video_ids)
        )
        videos_stats_response = videos_stats_request.execute()
        
        # Formater les vidéos
        recent_videos = []
        for video in videos_stats_response['items']:
            recent_videos.append({
                'id': video['id'],
                'title': video['snippet']['title'],
                'thumbnail': video['snippet']['thumbnails']['medium']['url'],
                'published_at': video['snippet']['publishedAt'],
                'views': int(video['statistics'].get('viewCount', 0)),
                'likes': int(video['statistics'].get('likeCount', 0)),
                'comments': int(video['statistics'].get('commentCount', 0))
            })
        
        # Sauvegarder dans Firestore
        db = firestore.client()
        user_ref = db.collection('influencers').document(user_id)
        
        user_ref.update({
            'socialAccounts.youtube': {
                'connected': True,
                'channelId': channel_id,
                'channelName': channel_title,
                'channelThumbnail': channel_thumbnail,
                'subscribers': subscribers,
                'videoCount': video_count,
                'viewCount': view_count,
                'lastUpdated': firestore.SERVER_TIMESTAMP,
                'recentVideos': recent_videos
            }
        })

        save_tokens(user_id, 'youtube', {
            'accessToken': credentials.token,
            'refreshToken': credentials.refresh_token,
            'tokenUri': credentials.token_uri,
            'clientId': credentials.client_id,
            'clientSecret': credentials.client_secret,
            'scopes': list(credentials.scopes),
            'createdAt': firestore.SERVER_TIMESTAMP
        })
        
        print(f"[YouTube Callback] Données sauvegardées pour {channel_title}")
        
        return {
            'success': True,
            'channelName': channel_title,
            'subscribers': subscribers,
            'videoCount': video_count
        }
        
    except Exception as e:
        print(f"[YouTube Callback] Erreur: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


def update_youtube_stats(user_id: str, tokens: dict) -> dict:
    """
    Met à jour les statistiques YouTube (appelé quotidiennement)
    
    Args:
        user_id: ID de l'utilisateur Firebase
        tokens: Dictionnaire avec les tokens YouTube
        
    Returns:
        Résultat de la mise à jour
    """
    try:
        # Recréer les credentials depuis les tokens sauvegardés
        credentials = Credentials(
            token=tokens.get('accessToken'),
            refresh_token=tokens.get('refreshToken'),
            token_uri=tokens.get('tokenUri'),
            client_id=tokens.get('clientId'),
            client_secret=tokens.get('clientSecret'),
            scopes=tokens.get('scopes')
        )
        
        # Créer le client YouTube API
        youtube = build('youtube', 'v3', credentials=credentials)
        
        # Récupérer les infos du canal
        request = youtube.channels().list(
            part='snippet,statistics,contentDetails',
            mine=True
        )
        response = request.execute()
        
        if not response['items']:
            return {'success': False, 'error': 'Canal non trouvé'}
        
        channel = response['items'][0]
        stats = channel['statistics']
        
        subscribers = int(stats.get('subscriberCount', 0))
        video_count = int(stats.get('videoCount', 0))
        view_count = int(stats.get('viewCount', 0))
        
        # Récupérer les 6 dernières vidéos
        uploads_playlist_id = channel['contentDetails']['relatedPlaylists']['uploads']
        
        videos_request = youtube.playlistItems().list(
            part='snippet,contentDetails',
            playlistId=uploads_playlist_id,
            maxResults=6
        )
        videos_response = videos_request.execute()
        
        # Stats des vidéos
        video_ids = [item['contentDetails']['videoId'] for item in videos_response['items']]
        
        videos_stats_request = youtube.videos().list(
            part='statistics,snippet',
            id=','.join(video_ids)
        )
        videos_stats_response = videos_stats_request.execute()
        
        # Formater les vidéos
        recent_videos = []
        for video in videos_stats_response['items']:
            recent_videos.append({
                'id': video['id'],
                'title': video['snippet']['title'],
                'thumbnail': video['snippet']['thumbnails']['medium']['url'],
                'published_at': video['snippet']['publishedAt'],
                'views': int(video['statistics'].get('viewCount', 0)),
                'likes': int(video['statistics'].get('likeCount', 0)),
                'comments': int(video['statistics'].get('commentCount', 0))
            })
        
        # Mettre à jour Firestore
        db = firestore.client()
        user_ref = db.collection('influencers').document(user_id)
        
        user_ref.update({
            'socialAccounts.youtube.subscribers': subscribers,
            'socialAccounts.youtube.videoCount': video_count,
            'socialAccounts.youtube.viewCount': view_count,
            'socialAccounts.youtube.lastUpdated': firestore.SERVER_TIMESTAMP,
            'socialAccounts.youtube.recentVideos': recent_videos
        })
        
        # Mettre à jour le token si rafraîchi
        if credentials.token != tokens.get('accessToken'):
            save_tokens(user_id, 'youtube', {
                **tokens,
                'accessToken': credentials.token,
                'updatedAt': firestore.SERVER_TIMESTAMP
            })
        
        return {
            'success': True,
            'subscribers': subscribers,
            'videoCount': len(recent_videos)
        }
        
    except Exception as e:
        print(f"Erreur mise à jour YouTube pour {user_id}: {str(e)}")
        return {'success': False, 'error': str(e)}
