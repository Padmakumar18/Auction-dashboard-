import { formatCurrency, validatePlayer, parseCSV } from "../utils/helpers";
import { Plus, Upload, Edit2, Trash2, Filter, Grid, List } from "lucide-react";

const PlayerGrid = ({ data, teams, isAuthenticated, onEdit, onDelete }) => {
  const getTeamName = (soldTo) => {
    return teams.find((t) => t.id === soldTo)?.team_name || "-";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "sold":
        return "bg-green-100 text-green-800";
      case "unsold":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {data.length === 0 ? (
        <div className="col-span-full text-center py-12 text-gray-500">
          No players available
        </div>
      ) : (
        data.map((player, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-200"
          >
            {/* Player Photo */}
            <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 p-4 flex items-center justify-center h-48 sm:h-56">
              <img
                src={player.player_photo}
                alt={player.name}
                className="max-w-full max-h-full object-contain rounded-lg"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/images/default-avatar.png";
                }}
              />
              {/* Status Badge */}
              <div className="absolute top-2 right-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusColor(
                    player.status
                  )}`}
                >
                  {player.status}
                </span>
              </div>
            </div>

            {/* Player Details */}
            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">
                {player.name}
              </h3>
              <p className="text-sm text-gray-600 mb-3">{player.role}</p>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Base Price:</span>
                  <span className="text-sm font-semibold text-gray-700">
                    {formatCurrency(player.base_price)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Sold Price:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(player.sold_price)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-500">Team:</span>
                  <span className="text-sm font-medium text-blue-600 truncate max-w-[150px]">
                    {getTeamName(player.sold_to)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {isAuthenticated && (
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => onEdit(player)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium"
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(player)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors text-sm font-medium"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default PlayerGrid;
