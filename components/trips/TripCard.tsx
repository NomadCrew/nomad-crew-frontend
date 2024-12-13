import { useState } from 'react';
import { format } from 'date-fns';
import { MapPin, Calendar, Users, ChevronRight, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TripCard = ({ 
  trip,
  onPress,
  style,
  expanded = false,
  onShare,
  participantAvatars = [],
  showParticipants = true,
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handlePressIn = () => setIsPressed(true);
  const handlePressOut = () => setIsPressed(false);

  const getStatusColor = () => {
    const now = new Date();
    if (new Date(trip.startDate) > now) {
      return 'bg-blue-500'; // Upcoming
    } else if (new Date(trip.endDate) < now) {
      return 'bg-gray-500'; // Past
    }
    return 'bg-green-500'; // Active
  };

  return (
    <motion.div
      animate={{
        scale: isPressed ? 0.98 : 1,
        opacity: isPressed ? 0.9 : 1,
      }}
      className={`
        bg-white dark:bg-gray-800 
        rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700
        overflow-hidden
        ${expanded ? 'p-4' : 'p-3'}
      `}
      style={style}
      onTouchStart={handlePressIn}
      onTouchEnd={handlePressOut}
      onClick={onPress}
    >
      {/* Status Indicator */}
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(trip.startDate) > new Date() ? 'Upcoming' : 
           new Date(trip.endDate) < new Date() ? 'Past' : 'Active'}
        </span>
      </div>

      {/* Main Content */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {trip.name}
          </h3>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-orange-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {trip.destination}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-orange-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {format(new Date(trip.startDate), 'MMM d')} - {format(new Date(trip.endDate), 'MMM d, yyyy')}
              </span>
            </div>
          </div>
        </div>

        {expanded ? (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onShare?.();
            }}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-700"
          >
            <Share2 size={20} className="text-gray-600 dark:text-gray-300" />
          </motion.button>
        ) : (
          <ChevronRight size={20} className="text-gray-400 mt-1" />
        )}
      </div>

      {/* Participants Section */}
      {showParticipants && (
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 flex items-center gap-2"
          >
            <div className="flex -space-x-2">
              {participantAvatars.slice(0, 3).map((avatar, index) => (
                <img
                  key={index}
                  src={avatar}
                  alt={`Participant ${index + 1}`}
                  className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800"
                />
              ))}
              {participantAvatars.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-600 dark:text-gray-300 border-2 border-white dark:border-gray-800">
                  +{participantAvatars.length - 3}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <Users size={14} />
              <span>{participantAvatars.length} participants</span>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  );
};

export default TripCard;