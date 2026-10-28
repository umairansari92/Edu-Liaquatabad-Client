import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { deleteStaffPhoto } from '../../store/slices/staffProfileSlice.js';
import {
  Camera,
  Trash2,
  CheckCircle,
  Building2,
  IdCard,
  User,
  Sparkles,
  Edit3,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { FieldVisibilityEye } from './FieldVisibilityEye.jsx';
import PhotoUploadModal from './PhotoUploadModal.jsx';
import EditProfileModal from './EditProfileModal.jsx';
import { getErrorMessage } from '../../utils/errorUtils.js';

export const ProfilePhotoCard = ({
  user = {},
  profile = {},
  studentProfile = null,
  targetId = 'me',
  isOwner = false,
  canManagePrivacy = false,
  onVisibilityChange,
  fieldVisibility = {},
  isColleagueView = false,
}) => {
  const dispatch = useDispatch();
  const { isUploadingPhoto } = useSelector((state) => state.staffProfile);

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Determine current photo URL
  const photoUrl =
    profile?.profilePhoto?.secureUrl ||
    studentProfile?.studentPhotoUrl ||
    user?.profileImage?.url ||
    '';

  const isStudent = user?.role === 'STUDENT';
  const employeeIdentifier = isStudent
    ? studentProfile?.grNumber || profile?.rollNumber || 'N/A'
    : profile?.employeeId || 'ID-PENDING';

  const handleDeletePhoto = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await dispatch(deleteStaffPhoto({ targetId })).unwrap();
      toast.success('Profile photo removed.');
    } catch (deleteError) {
      toast.error(getErrorMessage(deleteError, 'Failed to remove profile photo.'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col items-center text-center space-y-4 relative overflow-hidden">
        {/* Top Badges: Status & Photo Privacy Eye */}
        <div className="w-full flex items-center justify-between">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-[#4B7F3A] border border-emerald-200 flex items-center gap-1 shadow-2xs">
            <CheckCircle className="w-3 h-3" />
            {user?.status || 'ACTIVE'}
          </span>

          {!isColleagueView && (
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-medium text-slate-400">Photo:</span>
              <FieldVisibilityEye
                field="profilePhoto"
                label="Profile Photo"
                currentTier={fieldVisibility.profilePhoto || 'PUBLIC'}
                isOwner={canManagePrivacy}
                onUpdate={onVisibilityChange}
              />
            </div>
          )}
        </div>

        {/* Prominent Profile Photo Portrait Area (Directly matching user sketch) */}
        <div className="relative group w-full max-w-[220px] aspect-[3/4] rounded-2xl bg-gradient-to-b from-slate-100 to-blue-50/40 border-2 border-slate-200/80 overflow-hidden shadow-md flex items-center justify-center">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={user?.fullName || 'Profile Photo'}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <div className="w-20 h-20 rounded-2xl bg-blue-100/60 border border-blue-200 flex items-center justify-center text-[#006AC7] text-3xl font-extrabold shadow-inner mb-2">
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="text-xs font-bold text-[#102033]">{user?.fullName}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">No photo uploaded</span>

              {/* Explicit touch-accessible upload button when no photo exists */}
              {(isOwner || canManagePrivacy) && (
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(true)}
                  disabled={isUploadingPhoto || isDeleting}
                  className="mt-3 px-3 py-1.5 rounded-xl bg-[#006AC7] hover:bg-[#00529B] text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  aria-label="Upload personal profile photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Upload Photo
                </button>
              )}
            </div>
          )}

          {/* Action Overlay for Owner or Admin (Desktop hover & keyboard focus) */}
          {(isOwner || canManagePrivacy) && (
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2.5 p-4 pointer-events-none group-hover:pointer-events-auto focus-within:pointer-events-auto">
              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(true)}
                disabled={isUploadingPhoto || isDeleting}
                className="w-full max-w-[150px] py-2 px-3 rounded-xl bg-white hover:bg-blue-50 text-[#102033] text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all transform hover:scale-102 cursor-pointer pointer-events-auto"
                aria-label={photoUrl ? 'Change profile photo' : 'Upload profile photo'}
              >
                <Camera className="w-3.5 h-3.5 text-[#006AC7]" />
                {photoUrl ? 'Change Photo' : 'Upload Photo'}
              </button>

              {photoUrl && (
                <button
                  type="button"
                  onClick={handleDeletePhoto}
                  disabled={isUploadingPhoto || isDeleting}
                  className="w-full max-w-[150px] py-1.5 px-3 rounded-xl bg-rose-600/90 hover:bg-rose-700 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer pointer-events-auto"
                  aria-label="Remove profile photo"
                >
                  {isDeleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  Remove Photo
                </button>
              )}
            </div>
          )}

          {/* Quick-Action Camera button for touch devices when photo is present */}
          {(isOwner || canManagePrivacy) && photoUrl && (
            <button
              type="button"
              onClick={() => setIsPhotoModalOpen(true)}
              disabled={isUploadingPhoto || isDeleting}
              title="Change Profile Photo"
              aria-label="Change Profile Photo on mobile"
              className="absolute bottom-2 right-2 sm:hidden p-2 rounded-full bg-white/95 shadow-md border border-slate-200 text-[#006AC7] hover:bg-white z-10"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Identity Details */}
        <div className="w-full space-y-1">
          <h2 className="text-lg font-bold text-[#102033] tracking-tight leading-snug">
            {user?.fullName || 'Staff Member'}
          </h2>

          <div className="text-xs font-semibold text-[#006AC7]">
            {isStudent ? 'Enrolled Student' : user?.designation || 'Teacher / Staff'}
          </div>

          {!isColleagueView && (
            <div className="font-mono text-[11px] font-bold text-slate-600 flex items-center justify-center gap-1.5 pt-0.5">
              <IdCard className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {isStudent ? 'Roll No:' : 'Personal ID:'}{' '}
                <span className="text-[#102033]">{employeeIdentifier}</span>
              </span>
            </div>
          )}

          <div className="text-[11px] text-[#526477] flex items-center justify-center gap-1 pt-1 truncate">
            <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="truncate">
              {user?.school?.name || user?.claimedSchoolId?.name || 'Education Department LTC'}
            </span>
          </div>
        </div>

        {/* Edit Profile Details Action Button */}
        {(isOwner || canManagePrivacy) && (
          <div className="w-full pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditProfileModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-blue-50/60 hover:border-[#006AC7]/40 text-[#102033] hover:text-[#006AC7] text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-2"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#006AC7]" />
              Edit Profile Details
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <PhotoUploadModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        targetId={targetId}
        currentPhotoUrl={photoUrl}
      />

      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        targetId={targetId}
        userData={user}
        profileData={profile}
      />
    </>
  );
};

export default ProfilePhotoCard;
