"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  X,
  Camera,
  User,
  Car,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SimpleModal as Modal } from "@/components/ui/modal";

export interface AccidentReportData {
  // Basic Info
  accidentDate: string;
  accidentTime: string;
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    latitude?: number;
    longitude?: number;
  };
  weatherConditions: string;
  roadConditions: string;

  // Driver Info
  driverId: string;
  driverName: string;
  wasInjured: boolean;
  injuryDetails?: string;

  // Vehicle Info
  vehicleId: string;
  vehicleDamage: "none" | "minor" | "moderate" | "severe" | "total";
  damageDescription: string;

  // Details
  description: string;
  policeReportFiled: boolean;
  policeReportNumber?: string;

  // Other Parties
  otherParties: {
    name: string;
    phone: string;
    email?: string;
    insurance: string;
    policyNumber: string;
    vehicleInfo: string;
  }[];

  // Witnesses
  witnesses: {
    name: string;
    phone: string;
    email?: string;
    statement?: string;
  }[];

  // Photos
  photos: {
    id: string;
    description: string;
    file?: File;
    url?: string;
  }[];
}

interface AccidentReportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AccidentReportData) => void;
}

const WEATHER_OPTIONS = [
  { value: "clear", label: "Clear" },
  { value: "cloudy", label: "Cloudy" },
  { value: "rain", label: "Rain" },
  { value: "snow", label: "Snow" },
  { value: "fog", label: "Fog" },
  { value: "ice", label: "Ice" },
];

const ROAD_CONDITIONS = [
  { value: "dry", label: "Dry" },
  { value: "wet", label: "Wet" },
  { value: "icy", label: "Icy" },
  { value: "snow_covered", label: "Snow Covered" },
  { value: "construction", label: "Construction Zone" },
];

const DAMAGE_LEVELS = [
  { value: "none", label: "None" },
  { value: "minor", label: "Minor" },
  { value: "moderate", label: "Moderate" },
  { value: "severe", label: "Severe" },
  { value: "total", label: "Total Loss" },
];

export function AccidentReportWizard({ isOpen, onClose, onSubmit }: AccidentReportWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<AccidentReportData>({
    accidentDate: "",
    accidentTime: "",
    location: {
      address: "",
      city: "",
      state: "",
      zipCode: "",
    },
    weatherConditions: "",
    roadConditions: "",
    driverId: "",
    driverName: "",
    wasInjured: false,
    vehicleId: "",
    vehicleDamage: "none",
    damageDescription: "",
    description: "",
    policeReportFiled: false,
    otherParties: [],
    witnesses: [],
    photos: [],
  });

  const steps = [
    { title: "Basic Info", description: "When and where did the accident occur?" },
    { title: "Details", description: "What happened and vehicle damage assessment" },
    { title: "Other Parties", description: "Information about other vehicles/people involved" },
    { title: "Witnesses", description: "Witness contact information and statements" },
    { title: "Photos", description: "Upload photos of the scene and damage" },
    { title: "Review", description: "Review and submit the report" },
  ];

  const updateFormData = useCallback((updates: Partial<AccidentReportData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const addOtherParty = () => {
    const newParty = {
      name: "",
      phone: "",
      email: "",
      insurance: "",
      policyNumber: "",
      vehicleInfo: "",
    };
    updateFormData({
      otherParties: [...formData.otherParties, newParty]
    });
  };

  const removeOtherParty = (index: number) => {
    const updated = formData.otherParties.filter((_, i) => i !== index);
    updateFormData({ otherParties: updated });
  };

  const updateOtherParty = (index: number, updates: Partial<typeof formData.otherParties[0]>) => {
    const updated = formData.otherParties.map((party, i) =>
      i === index ? { ...party, ...updates } : party
    );
    updateFormData({ otherParties: updated });
  };

  const addWitness = () => {
    const newWitness = {
      name: "",
      phone: "",
      email: "",
      statement: "",
    };
    updateFormData({
      witnesses: [...formData.witnesses, newWitness]
    });
  };

  const removeWitness = (index: number) => {
    const updated = formData.witnesses.filter((_, i) => i !== index);
    updateFormData({ witnesses: updated });
  };

  const updateWitness = (index: number, updates: Partial<typeof formData.witnesses[0]>) => {
    const updated = formData.witnesses.map((witness, i) =>
      i === index ? { ...witness, ...updates } : witness
    );
    updateFormData({ witnesses: updated });
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
    // Reset form
    setCurrentStep(0);
    setFormData({
      accidentDate: "",
      accidentTime: "",
      location: { address: "", city: "", state: "", zipCode: "" },
      weatherConditions: "",
      roadConditions: "",
      driverId: "",
      driverName: "",
      wasInjured: false,
      vehicleId: "",
      vehicleDamage: "none",
      damageDescription: "",
      description: "",
      policeReportFiled: false,
      otherParties: [],
      witnesses: [],
      photos: [],
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Accident Date
                </label>
                <Input
                  type="date"
                  value={formData.accidentDate}
                  onChange={(e) => updateFormData({ accidentDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Accident Time
                </label>
                <Input
                  type="time"
                  value={formData.accidentTime}
                  onChange={(e) => updateFormData({ accidentTime: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Location Address
              </label>
              <Input
                placeholder="Street address where accident occurred"
                value={formData.location.address}
                onChange={(e) => updateFormData({
                  location: { ...formData.location, address: e.target.value }
                })}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">City</label>
                <Input
                  placeholder="City"
                  value={formData.location.city}
                  onChange={(e) => updateFormData({
                    location: { ...formData.location, city: e.target.value }
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">State</label>
                <Input
                  placeholder="ST"
                  maxLength={2}
                  value={formData.location.state}
                  onChange={(e) => updateFormData({
                    location: { ...formData.location, state: e.target.value.toUpperCase() }
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">ZIP Code</label>
                <Input
                  placeholder="12345"
                  value={formData.location.zipCode}
                  onChange={(e) => updateFormData({
                    location: { ...formData.location, zipCode: e.target.value }
                  })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Weather Conditions
                </label>
                <Select
                  value={formData.weatherConditions}
                  onValueChange={(value) => updateFormData({ weatherConditions: value as string })}
                  options={WEATHER_OPTIONS}
                  placeholder="Select weather"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Road Conditions
                </label>
                <Select
                  value={formData.roadConditions}
                  onValueChange={(value) => updateFormData({ roadConditions: value as string })}
                  options={ROAD_CONDITIONS}
                  placeholder="Select road conditions"
                />
              </div>
            </div>
          </div>
        );

      case 1: // Details
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Driver Information
              </label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  placeholder="Driver ID"
                  value={formData.driverId}
                  onChange={(e) => updateFormData({ driverId: e.target.value })}
                />
                <Input
                  placeholder="Driver Name"
                  value={formData.driverName}
                  onChange={(e) => updateFormData({ driverName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Was the driver injured?
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => updateFormData({ wasInjured: false, injuryDetails: undefined })}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    !formData.wasInjured
                      ? "border-apollo-cyan-600 bg-apollo-cyan-50 text-apollo-cyan-700 dark:bg-apollo-cyan-900/20"
                      : "border-border bg-background"
                  }`}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => updateFormData({ wasInjured: true })}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    formData.wasInjured
                      ? "border-red-600 bg-red-50 text-red-700 dark:bg-red-900/20"
                      : "border-border bg-background"
                  }`}
                >
                  Yes
                </button>
              </div>
            </div>

            {formData.wasInjured && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Injury Details
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the injuries..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  value={formData.injuryDetails || ""}
                  onChange={(e) => updateFormData({ injuryDetails: e.target.value })}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Vehicle Damage Level
              </label>
              <Select
                value={formData.vehicleDamage}
                onValueChange={(value) => updateFormData({ vehicleDamage: value as AccidentReportData['vehicleDamage'] })}
                options={DAMAGE_LEVELS}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Describe what happened
              </label>
              <textarea
                rows={4}
                placeholder="Provide a detailed description of the accident..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={formData.description}
                onChange={(e) => updateFormData({ description: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Police Report
              </label>
              <div className="space-y-3">
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => updateFormData({ policeReportFiled: false, policeReportNumber: undefined })}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      !formData.policeReportFiled
                        ? "border-apollo-cyan-600 bg-apollo-cyan-50 text-apollo-cyan-700 dark:bg-apollo-cyan-900/20"
                        : "border-border bg-background"
                    }`}
                  >
                    No Police Report
                  </button>
                  <button
                    type="button"
                    onClick={() => updateFormData({ policeReportFiled: true })}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      formData.policeReportFiled
                        ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/20"
                        : "border-border bg-background"
                    }`}
                  >
                    Police Report Filed
                  </button>
                </div>
                {formData.policeReportFiled && (
                  <Input
                    placeholder="Police Report Number"
                    value={formData.policeReportNumber || ""}
                    onChange={(e) => updateFormData({ policeReportNumber: e.target.value })}
                  />
                )}
              </div>
            </div>
          </div>
        );

      case 2: // Other Parties
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-foreground">Other Parties Involved</h3>
              <Button variant="outline" size="sm" onClick={addOtherParty}>
                <Plus className="h-4 w-4 mr-2" />
                Add Party
              </Button>
            </div>

            {formData.otherParties.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Car className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No other parties involved</p>
                <p className="text-xs">Click &quot;Add Party&quot; if other vehicles or people were involved</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.otherParties.map((party, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-border p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground">Party {index + 1}</h4>
                      <button
                        onClick={() => removeOtherParty(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Input
                        placeholder="Name"
                        value={party.name}
                        onChange={(e) => updateOtherParty(index, { name: e.target.value })}
                      />
                      <Input
                        placeholder="Phone"
                        value={party.phone}
                        onChange={(e) => updateOtherParty(index, { phone: e.target.value })}
                      />
                      <Input
                        placeholder="Insurance Company"
                        value={party.insurance}
                        onChange={(e) => updateOtherParty(index, { insurance: e.target.value })}
                      />
                      <Input
                        placeholder="Policy Number"
                        value={party.policyNumber}
                        onChange={(e) => updateOtherParty(index, { policyNumber: e.target.value })}
                      />
                    </div>

                    <Input
                      placeholder="Vehicle Information (Year, Make, Model, License Plate)"
                      value={party.vehicleInfo}
                      onChange={(e) => updateOtherParty(index, { vehicleInfo: e.target.value })}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        );

      case 3: // Witnesses
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-foreground">Witnesses</h3>
              <Button variant="outline" size="sm" onClick={addWitness}>
                <Plus className="h-4 w-4 mr-2" />
                Add Witness
              </Button>
            </div>

            {formData.witnesses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No witnesses added</p>
                <p className="text-xs">Add witness information if available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.witnesses.map((witness, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-border p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground">Witness {index + 1}</h4>
                      <button
                        onClick={() => removeWitness(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Input
                        placeholder="Name"
                        value={witness.name}
                        onChange={(e) => updateWitness(index, { name: e.target.value })}
                      />
                      <Input
                        placeholder="Phone"
                        value={witness.phone}
                        onChange={(e) => updateWitness(index, { phone: e.target.value })}
                      />
                    </div>

                    <textarea
                      rows={3}
                      placeholder="Witness statement (optional)"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      value={witness.statement || ""}
                      onChange={(e) => updateWitness(index, { statement: e.target.value })}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        );

      case 4: // Photos
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-foreground">Accident Photos</h3>
              <Button variant="outline" size="sm">
                <Camera className="h-4 w-4 mr-2" />
                Add Photos
              </Button>
            </div>

            <div className="text-center py-8 text-muted-foreground">
              <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Photo upload functionality</p>
              <p className="text-xs">Upload photos of vehicle damage, accident scene, and documents</p>
            </div>
          </div>
        );

      case 5: // Review
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-foreground">Review Accident Report</h3>

            <div className="space-y-4">
              <div className="rounded-lg border border-border p-4">
                <h4 className="font-medium text-foreground mb-2">Basic Information</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Date: {formData.accidentDate} at {formData.accidentTime}</p>
                  <p>Location: {formData.location.address}, {formData.location.city}, {formData.location.state} {formData.location.zipCode}</p>
                  <p>Weather: {formData.weatherConditions}, Road: {formData.roadConditions}</p>
                </div>
              </div>

              <div className="rounded-lg border border-border p-4">
                <h4 className="font-medium text-foreground mb-2">Driver & Vehicle</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Driver: {formData.driverName} ({formData.driverId})</p>
                  <p>Injured: {formData.wasInjured ? "Yes" : "No"}</p>
                  <p>Vehicle Damage: {formData.vehicleDamage}</p>
                  <p>Police Report: {formData.policeReportFiled ? `Yes (${formData.policeReportNumber})` : "No"}</p>
                </div>
              </div>

              {formData.otherParties.length > 0 && (
                <div className="rounded-lg border border-border p-4">
                  <h4 className="font-medium text-foreground mb-2">Other Parties ({formData.otherParties.length})</h4>
                  <div className="text-sm text-muted-foreground">
                    {formData.otherParties.map((party, index) => (
                      <p key={index}>• {party.name} - {party.insurance}</p>
                    ))}
                  </div>
                </div>
              )}

              {formData.witnesses.length > 0 && (
                <div className="rounded-lg border border-border p-4">
                  <h4 className="font-medium text-foreground mb-2">Witnesses ({formData.witnesses.length})</h4>
                  <div className="text-sm text-muted-foreground">
                    {formData.witnesses.map((witness, index) => (
                      <p key={index}>• {witness.name} - {witness.phone}</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-border p-4">
                <h4 className="font-medium text-foreground mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{formData.description}</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Accident Report"
      size="lg"
    >
      <div className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div
                className={`
                  flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium
                  ${index <= currentStep
                    ? "bg-apollo-cyan-600 text-white"
                    : "bg-muted text-muted-foreground"
                  }
                `}
              >
                {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`
                    h-0.5 w-8 sm:w-12 ml-2
                    ${index < currentStep ? "bg-apollo-cyan-600" : "bg-border"}
                  `}
                />
              )}
            </div>
          ))}
        </div>

        <div className="text-center">
          <h2 className="text-lg font-medium text-foreground">{steps[currentStep].title}</h2>
          <p className="text-sm text-muted-foreground">{steps[currentStep].description}</p>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="min-h-[400px]"
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {currentStep === steps.length - 1 ? (
            <Button onClick={handleSubmit} className="bg-apollo-cyan-600 hover:bg-apollo-cyan-700">
              Submit Report
              <Check className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={nextStep}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
