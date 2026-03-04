"use client";

import { Calendar } from "lucide-react";
import { AvailabilityManager } from "../AvailabilityManager";

export function AvailabilityTab({ form, setForm }) {
  return (
    <>
      {["booking", "hybrid"].includes(form.orderType) ? (
        <AvailabilityManager
          availability={form.availability}
          onChange={(avail) => setForm({ ...form, availability: avail })}
        />
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-gray-900 font-medium">No Schedule Needed</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            Milestone projects don't use calendar scheduling. They rely on delivery days and phase
            deadlines instead.
          </p>
        </div>
      )}
    </>
  );
}