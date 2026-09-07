import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DocumentUpload, UploadedDocument } from "./DocumentUpload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";

export type KycStep = "verification_type" | "personal_info" | "documents" | "review" | "complete";

export interface KycData {
  verificationType: "individual" | "business";
  fullName: string;
  birthDate: string;
  nationality: string;
  idType: "passport" | "national_id" | "drivers_license";
  idNumber: string;
  idFrontDocument?: UploadedDocument;
  idBackDocument?: UploadedDocument;
  selfieDocument?: UploadedDocument;
  businessName?: string;
  businessRegistration?: UploadedDocument;
  businessTaxId?: string;
}

interface KycFormProps {
  onComplete?: (data: KycData) => void;
  isSubmitting?: boolean;
}

export const KycForm = ({ onComplete, isSubmitting = false }: KycFormProps) => {
  const [currentStep, setCurrentStep] = useState<KycStep>("verification_type");
  const [data, setData] = useState<KycData>({
    verificationType: "individual",
    fullName: "",
    birthDate: "",
    nationality: "DZ",
    idType: "national_id",
    idNumber: "",
  });

  const steps: { id: KycStep; label: string; icon: string }[] = [
    { id: "verification_type", label: "Type", icon: "1" },
    { id: "personal_info", label: "Info", icon: "2" },
    { id: "documents", label: "Documents", icon: "3" },
    { id: "review", label: "Review", icon: "4" },
    { id: "complete", label: "Complete", icon: "✓" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const handleNext = () => {
    const nextStep = steps[currentStepIndex + 1];
    if (nextStep) {
      setCurrentStep(nextStep.id);
    }
  };

  const handlePrevious = () => {
    const prevStep = steps[currentStepIndex - 1];
    if (prevStep) {
      setCurrentStep(prevStep.id);
    }
  };

  const handleSubmit = () => {
    onComplete?.(data);
  };

  const isIndividual = data.verificationType === "individual";
  const isBusiness = data.verificationType === "business";

  return (
    <div className="space-y-8">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            {/* Step Circle */}
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                index <= currentStepIndex
                  ? "bg-primary text-white"
                  : "bg-border text-muted-foreground"
              }`}
            >
              {step.icon}
            </div>

            {/* Step Label */}
            <p
              className={`ml-2 text-xs font-medium ${
                index <= currentStepIndex
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {step.label}
            </p>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-3 rounded transition-all ${
                  index < currentStepIndex ? "bg-primary" : "bg-border"
                }`}
              ></div>
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-card border border-border rounded-lg p-8">
        {/* Step 1: Verification Type */}
        {currentStep === "verification_type" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">What type of verification?</h3>
              <p className="text-sm text-muted-foreground">
                Choose whether you're verifying as an individual or a business
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Individual Option */}
              <button
                onClick={() =>
                  setData({ ...data, verificationType: "individual" })
                }
                className={`p-6 rounded-lg border-2 transition-all text-left ${
                  isIndividual
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="space-y-2">
                  <h4 className="font-semibold">Individual</h4>
                  <p className="text-sm text-muted-foreground">
                    I'm verifying as a person for buying and selling
                  </p>
                </div>
              </button>

              {/* Business Option */}
              <button
                onClick={() =>
                  setData({ ...data, verificationType: "business" })
                }
                className={`p-6 rounded-lg border-2 transition-all text-left ${
                  isBusiness
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="space-y-2">
                  <h4 className="font-semibold">Business</h4>
                  <p className="text-sm text-muted-foreground">
                    I'm verifying a company for enterprise selling
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Personal/Business Info */}
        {currentStep === "personal_info" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                {isIndividual ? "Personal Information" : "Business Information"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isIndividual
                  ? "Provide your personal details"
                  : "Provide your business details"}
              </p>
            </div>

            <div className="space-y-4">
              {/* Full Name / Business Name */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isIndividual ? "Full Name" : "Business Name"}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <Input
                  placeholder={isIndividual ? "John Doe" : "Acme Corporation"}
                  value={isIndividual ? data.fullName : data.businessName || ""}
                  onChange={(e) =>
                    setData(
                      isIndividual
                        ? { ...data, fullName: e.target.value }
                        : { ...data, businessName: e.target.value }
                    )
                  }
                />
              </div>

              {/* Individual Only */}
              {isIndividual && (
                <>
                  {/* Birth Date */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Date of Birth
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <Input
                      type="date"
                      value={data.birthDate}
                      onChange={(e) =>
                        setData({ ...data, birthDate: e.target.value })
                      }
                    />
                  </div>

                  {/* Nationality */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Nationality
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <Select value={data.nationality} onValueChange={(value) =>
                      setData({ ...data, nationality: value })
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DZ">Algeria</SelectItem>
                        <SelectItem value="FR">France</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="GB">United Kingdom</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* ID Type */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      ID Type
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <Select value={data.idType} onValueChange={(value: any) =>
                      setData({ ...data, idType: value })
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="national_id">National ID</SelectItem>
                        <SelectItem value="passport">Passport</SelectItem>
                        <SelectItem value="drivers_license">Driver's License</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* ID Number */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      ID Number
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <Input
                      placeholder="e.g., 12345678901234"
                      value={data.idNumber}
                      onChange={(e) =>
                        setData({ ...data, idNumber: e.target.value })
                      }
                    />
                  </div>
                </>
              )}

              {/* Business Only */}
              {isBusiness && (
                <>
                  {/* Tax ID */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Tax ID / NIF
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <Input
                      placeholder="e.g., 98765432109876"
                      value={data.businessTaxId || ""}
                      onChange={(e) =>
                        setData({ ...data, businessTaxId: e.target.value })
                      }
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Documents */}
        {currentStep === "documents" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Upload Documents</h3>
              <p className="text-sm text-muted-foreground">
                Upload clear photos or scans of your documents
              </p>
            </div>

            <div className="space-y-6">
              {/* Individual Documents */}
              {isIndividual && (
                <>
                  {/* ID Front */}
                  <DocumentUpload
                    label={`${data.idType} - Front Side`}
                    description="Clear photo of the front side of your ID"
                    onUpload={() => {}}
                    uploadedDocument={data.idFrontDocument}
                    acceptedTypes={["image/jpeg", "image/png"]}
                  />

                  {/* ID Back */}
                  <DocumentUpload
                    label={`${data.idType} - Back Side`}
                    description="Clear photo of the back side of your ID"
                    onUpload={() => {}}
                    uploadedDocument={data.idBackDocument}
                    acceptedTypes={["image/jpeg", "image/png"]}
                  />

                  {/* Selfie */}
                  <DocumentUpload
                    label="Selfie with ID"
                    description="A selfie holding your ID next to your face (for liveness check)"
                    onUpload={() => {}}
                    uploadedDocument={data.selfieDocument}
                    acceptedTypes={["image/jpeg", "image/png"]}
                  />
                </>
              )}

              {/* Business Documents */}
              {isBusiness && (
                <>
                  {/* Business Registration */}
                  <DocumentUpload
                    label="Business Registration Document"
                    description="Registre de commerce or official business registration"
                    onUpload={() => {}}
                    uploadedDocument={data.businessRegistration}
                    acceptedTypes={["application/pdf", "image/jpeg", "image/png"]}
                    maxSize={10}
                  />
                </>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-900 dark:text-blue-100">
                All documents must be clear, legible, and recent. Verification typically takes 24-48 hours.
              </p>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === "review" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Review Your Information</h3>
              <p className="text-sm text-muted-foreground">
                Please review your information before submitting
              </p>
            </div>

            <div className="space-y-4">
              {/* Verification Type */}
              <div className="border border-border rounded-lg p-4">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Verification Type
                </p>
                <p className="font-medium capitalize">{data.verificationType}</p>
              </div>

              {/* Name */}
              <div className="border border-border rounded-lg p-4">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {isIndividual ? "Full Name" : "Business Name"}
                </p>
                <p className="font-medium">
                  {isIndividual ? data.fullName : data.businessName}
                </p>
              </div>

              {/* ID Info */}
              {isIndividual && (
                <>
                  <div className="border border-border rounded-lg p-4">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      ID Type
                    </p>
                    <p className="font-medium capitalize">{data.idType}</p>
                  </div>

                  <div className="border border-border rounded-lg p-4">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Birth Date
                    </p>
                    <p className="font-medium">{data.birthDate}</p>
                  </div>
                </>
              )}

              {/* Documents */}
              <div className="border border-border rounded-lg p-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Documents
                </p>
                <div className="space-y-1">
                  {data.idFrontDocument && (
                    <p className="text-sm flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ID Front
                    </p>
                  )}
                  {data.idBackDocument && (
                    <p className="text-sm flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ID Back
                    </p>
                  )}
                  {data.selfieDocument && (
                    <p className="text-sm flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Selfie
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Confirmation */}
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <p className="text-sm text-foreground">
                By submitting, you confirm that all information is accurate and
                you accept our terms and conditions.
              </p>
            </div>
          </div>
        )}

        {/* Step 5: Complete */}
        {currentStep === "complete" && (
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold">Verification Submitted!</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your KYC documents have been submitted for review. You'll receive
              an email notification once verification is complete. This typically
              takes 24-48 hours.
            </p>

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>What's next?</strong> You can continue browsing the
                marketplace while we verify your documents. You'll be notified
                via email when verification is complete.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-3 justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === "verification_type"}
        >
          Previous
        </Button>

        {currentStep !== "complete" && (
          <Button
            onClick={currentStep === "review" ? handleSubmit : handleNext}
            disabled={isSubmitting}
          >
            {currentStep === "review" ? (
              "Submit Verification"
            ) : (
              <>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}

        {currentStep === "complete" && (
          <Button onClick={() => (window.location.href = "/")}>
            Back to Dashboard
          </Button>
        )}
      </div>
    </div>
  );
};
