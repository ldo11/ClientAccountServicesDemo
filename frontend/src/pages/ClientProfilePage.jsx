import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function ClientProfilePage() {
  const { clientId, updateStoredUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      setLoading(true);
      try {
        const res = await api.get(`/clients/${clientId}`);
        if (active) {
          setProfile(res.data);
          setMobile(res.data.mobile || '');
          setAddress(res.data.address || '');
        }
      } catch (err) {
        if (active) {
          setErrorMsg(err.response?.data?.message || 'Failed to load client profile');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    if (clientId) {
      loadProfile();
    }
    return () => {
      active = false;
    };
  }, [clientId]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!mobile.trim() || !address.trim()) {
      setErrorMsg('Mobile number and residential address cannot be empty');
      return;
    }

    setSaving(true);
    try {
      const res = await api.put(`/clients/${clientId}`, {
        mobile: mobile.trim(),
        address: address.trim(),
      });
      const updated = res.data.client || res.data;
      setProfile((prev) => ({ ...(prev || {}), ...updated }));
      setMobile(updated.mobile);
      setAddress(updated.address);
      updateStoredUser(updated);
      setSuccessMsg('Profile updated successfully');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update client profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-slate-500">
        Loading client profile...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1
          id="profile-page-title"
          data-testid="profile-page-title"
          className="text-2xl font-bold text-slate-900"
        >
          Client Profile Information
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          View your account identifiers and keep your contact information up to date.
        </p>
      </div>

      {successMsg && (
        <div
          id="profile-update-success"
          data-testid="profile-update-success"
          role="status"
          className="mb-6 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-medium text-emerald-800"
        >
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div
          id="profile-update-error"
          data-testid="profile-update-error"
          role="alert"
          className="mb-6 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-medium text-rose-700"
        >
          {errorMsg}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 mb-6 border-b border-slate-200">
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Client ID
            </span>
            <div
              id="client-id-val"
              data-testid="client-id-val"
              className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-mono text-slate-700 break-all"
            >
              {profile?.clientId || clientId}
            </div>
          </div>

          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Username
            </span>
            <div
              id="client-username-val"
              data-testid="client-username-val"
              className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-800"
            >
              {profile?.username || ''}
            </div>
          </div>
        </div>

        <form noValidate onSubmit={handleUpdate} className="space-y-5">
          <div>
            <label
              htmlFor="client-mobile-input"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Mobile Phone Number
            </label>
            <input
              id="client-mobile-input"
              name="mobile"
              data-testid="client-mobile-input"
              type="text"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition"
            />
          </div>

          <div>
            <label
              htmlFor="client-address-input"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Residential Mailing Address
            </label>
            <input
              id="client-address-input"
              name="address"
              data-testid="client-address-input"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition"
            />
          </div>

          <div className="pt-2">
            <button
              id="update-profile-btn"
              data-testid="update-profile-btn"
              type="submit"
              disabled={saving}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2.5 px-6 text-sm shadow-sm transition-colors cursor-pointer"
            >
              {saving ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
