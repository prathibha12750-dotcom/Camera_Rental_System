
import { useEffect, useState } from "react";
import api from "../../services/api";

//added by abilash
// FR-169: Admin basic profile management
const AdminProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  //added by abilash
  // FR-169: Edit Profile state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  //ended by abilash


  useEffect(() => {
    const fetchProfile = async () => {
      try {        
        const response = await api.get("/auth/me");
        const user = response.data?.data?.user || null;

        setProfile(user);

        //added by abilash
        // FR-169: Populate edit form with existing profile information
        if (user) {
        setFormData({
            name: user.name || "",
            email: user.email || "",
        });
        }
        //ended by abilash

      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to load profile."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  
  //added by abilash
  // FR-169: Save Admin's own basic profile
  const handleSaveProfile = async () => {
    setSaveError("");
    setSuccessMessage("");

    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();

    if (name.length < 2 || name.length > 100) {
      setSaveError("Name must contain 2 to 100 characters.");
      return;
    }

    if (
      email.length > 150 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      setSaveError("Enter a valid email address.");
      return;
    }

    try {
      setSaving(true);

      const response = await api.put("/auth/me", {
        name,
        email,
      });

      const updatedUser = response.data?.data?.user;

      if (!updatedUser) {
        throw new Error("Updated profile was not returned.");
      }

      setProfile(updatedUser);
      setFormData({
        name: updatedUser.name,
        email: updatedUser.email,
      });

      setIsEditing(false);
      setSuccessMessage("Profile updated successfully.");
    } catch (err) {
      setSaveError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update profile."
      );
    } finally {
      setSaving(false);
    }
  };
  //ended by abilash


  if (loading) {
    return <div className="p-6">Loading profile...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  if (!profile) {
    return <div className="p-6">Profile not found.</div>;
  }

  return (
    <div className="p-6">
        
        {/* added by abilash */}
        {successMessage && (
        <p className="mb-4 rounded-lg bg-green-50 p-3 text-green-700">
            {successMessage}
        </p>
        )}

        {saveError && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">
            {saveError}
        </p>
        )}
        {/* ended by abilash */}

      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        My Profile
      </h1>
        {/* added by abilash */}
        {/* FR-169: Admin Profile View and Edit Form */}
        <div className="max-w-xl rounded-xl bg-white p-6 shadow-sm">

        {!isEditing ? (
            <>
            <p className="mb-3">
                <strong>Name:</strong> {profile.name}
            </p>

            <p className="mb-3">
                <strong>Email:</strong> {profile.email}
            </p>

            <p className="mb-5">
                <strong>Role:</strong> {profile.role}
            </p>

            <button
                type="button"
                onClick={() => {
                setFormData({
                    name: profile.name,
                    email: profile.email,
                });
                setSaveError("");
                setSuccessMessage("");
                setIsEditing(true);
                }}
                className="rounded-lg bg-orange-600 px-5 py-2 font-medium text-white hover:bg-orange-700"
            >
                Edit Profile
            </button>
            </>
        ) : (
            <div className="space-y-4">
            <div>
                <label
                htmlFor="admin-profile-name"
                className="mb-2 block font-medium text-gray-700"
                >
                Full Name
                </label>

                <input
                id="admin-profile-name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                    setFormData((previous) => ({
                    ...previous,
                    name: e.target.value,
                    }))
                }
                maxLength={100}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
                />
            </div>

            <div>
                <label
                htmlFor="admin-profile-email"
                className="mb-2 block font-medium text-gray-700"
                >
                Email Address
                </label>

                <input
                id="admin-profile-email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                    setFormData((previous) => ({
                    ...previous,
                    email: e.target.value,
                    }))
                }
                maxLength={150}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
                />
            </div>

            <p className="text-sm text-gray-500">
                Role: {profile.role} (cannot be changed)
            </p>

            <div className="flex gap-3">
                
                {/* added by abilash */}
                <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving}
                className="rounded-lg bg-orange-600 px-5 py-2 font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                {saving ? "Saving..." : "Save Changes"}
                </button>
                {/* ended by abilash */}


                <button
                type="button"
                onClick={() => {
                    setIsEditing(false);
                    setSaveError("");
                }}
                className="rounded-lg bg-gray-200 px-5 py-2 font-medium text-gray-800 hover:bg-gray-300"
                >
                Cancel
                </button>
            </div>
            </div>
        )}

        </div>
        {/* ended by abilash */}

    </div>
  );
};

export default AdminProfile;
//ended by abilash
