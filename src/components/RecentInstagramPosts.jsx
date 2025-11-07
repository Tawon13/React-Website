import React from 'react';
import { FaHeart, FaComment, FaInstagram } from 'react-icons/fa';

const RecentInstagramPosts = ({ recentMedia }) => {
  if (!recentMedia || recentMedia.length === 0) {
    return null;
  }

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num;
  };

  const getMediaTypeLabel = (type) => {
    switch (type) {
      case 'VIDEO':
        return '🎥';
      case 'CAROUSEL_ALBUM':
        return '📸';
      default:
        return '📷';
    }
  };

  return (
    <div className="mt-12">
      <div className="flex items-center gap-3 mb-6">
        <FaInstagram className="text-3xl text-pink-500" />
        <h2 className="text-2xl font-semibold">Dernières publications Instagram</h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {recentMedia.map((media) => (
          <a
            key={media.id}
            href={media.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 hover:opacity-95 transition-opacity"
          >
            {/* Image/Thumbnail */}
            <img
              src={media.url}
              alt={media.caption || 'Instagram post'}
              className="w-full h-full object-cover"
            />
            
            {/* Media Type Badge */}
            <div className="absolute top-3 right-3 text-2xl">
              {getMediaTypeLabel(media.type)}
            </div>
            
            {/* Overlay avec stats (visible au survol) */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4">
              {/* Stats en haut */}
              <div className="flex gap-4 text-white">
                <div className="flex items-center gap-2">
                  <FaHeart className="text-xl" />
                  <span className="font-semibold">{formatNumber(media.likes)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaComment className="text-xl" />
                  <span className="font-semibold">{formatNumber(media.comments)}</span>
                </div>
              </div>
              
              {/* Caption en bas */}
              {media.caption && (
                <p className="text-white text-sm line-clamp-3">
                  {media.caption}
                </p>
              )}
            </div>
          </a>
        ))}
      </div>
      
      {/* Note si moins de 6 posts */}
      {recentMedia.length < 6 && (
        <p className="text-gray-500 text-sm mt-4 text-center">
          Actualisé quotidiennement • {recentMedia.length} post{recentMedia.length > 1 ? 's' : ''} récent{recentMedia.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};

export default RecentInstagramPosts;
