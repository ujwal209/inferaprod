'use client'

import React, { useState, useEffect } from 'react'
import { getLaunchDate, updateLaunchDate } from '@/app/actions/launch'
import { toast } from 'sonner'
import { Loader2, Rocket, Calendar, Clock } from 'lucide-react'

export default function SecretLaunchControl() {
  const [datePart, setDatePart] = useState('')
  const [timePart, setTimePart] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Fetch the current launch date on mount
    getLaunchDate().then(d => {
      const targetDate = new Date(d)
      
      // Extract local date (YYYY-MM-DD)
      const yyyy = targetDate.getFullYear()
      const mm = String(targetDate.getMonth() + 1).padStart(2, '0')
      const dd = String(targetDate.getDate()).padStart(2, '0')
      setDatePart(`${yyyy}-${mm}-${dd}`)
      
      // Extract local time (HH:MM)
      const hh = String(targetDate.getHours()).padStart(2, '0')
      const min = String(targetDate.getMinutes()).padStart(2, '0')
      setTimePart(`${hh}:${min}`)
      
      setLoading(false)
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    
    // Combine the date and time back into a valid Date object using the user's local timezone
    const combinedDate = new Date(`${datePart}T${timePart}:00`)
    const isoString = combinedDate.toISOString()
    
    const res = await updateLaunchDate(isoString)
    
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success("Launch sequence updated globally!")
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] font-outfit text-white p-8 flex flex-col items-center justify-center selection:bg-blue-500/30">
      
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-[#0c0c0e]/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 border-b border-zinc-800/80 pb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Rocket className="text-blue-500" size={20} />
          </div>
          <div>
            <h1 className="font-google-sans text-xl font-bold tracking-tight text-zinc-100">Launch Control</h1>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mt-0.5">Admin Override</p>
          </div>
        </div>
        
        {/* Controls */}
        <div className="space-y-5">
          
          <div className="grid grid-cols-2 gap-4">
            {/* Date Picker Component */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider pl-1 flex items-center gap-1.5">
                <Calendar size={12} /> Target Date
              </label>
              <div className="relative">
                <input 
                  type="date" 
                  value={datePart}
                  onChange={(e) => setDatePart(e.target.value)}
                  className="w-full bg-[#111113] border border-zinc-800 rounded-xl px-4 py-3 text-[15px] font-medium text-white focus:bg-[#1a1a1d] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all cursor-pointer custom-calendar-icon"
                />
              </div>
            </div>

            {/* Time Picker Component */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider pl-1 flex items-center gap-1.5">
                <Clock size={12} /> Local Time
              </label>
              <div className="relative">
                <input 
                  type="time" 
                  value={timePart}
                  onChange={(e) => setTimePart(e.target.value)}
                  className="w-full bg-[#111113] border border-zinc-800 rounded-xl px-4 py-3 text-[15px] font-medium text-white focus:bg-[#1a1a1d] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all cursor-pointer custom-calendar-icon"
                />
              </div>
            </div>
          </div>
          
          {/* Status/Warning Text */}
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-lg p-3 text-center mt-2">
            <p className="text-[12px] font-medium text-zinc-400">
              Timer calculates using your local system timezone.
            </p>
          </div>
          
          {/* Save Action */}
          <button 
            onClick={handleSave}
            disabled={saving || !datePart || !timePart}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white font-google-sans font-bold h-14 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Deploying Update...
              </>
            ) : (
              "Update Launch Sequence"
            )}
          </button>
        </div>
      </div>

      {/* Inject a tiny bit of CSS to make the native calendar icons look better on webkit browsers */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-calendar-icon::-webkit-calendar-picker-indicator {
          filter: invert(1) opacity(0.5);
          cursor: pointer;
        }
        .custom-calendar-icon::-webkit-calendar-picker-indicator:hover {
          filter: invert(1) opacity(0.8);
        }
      `}} />
    </div>
  )
}