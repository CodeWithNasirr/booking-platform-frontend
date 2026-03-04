"use client";

import { useParams } from "next/navigation";
import PlanForm from "../../../_components/PlanForm";

export default function EditPlanPage() {
  const { id } = useParams();
  return <PlanForm planId={id} />;
}