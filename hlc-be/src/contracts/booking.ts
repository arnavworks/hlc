export interface CreateAppointmentInput {
  sessionId?: string;
  appointmentRequestId: string;
  appointmentMasterId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  zip: string;
  address: string;
  message: string;
}

export interface AppointmentTypeOption {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
}

export interface AppointmentSlotOption {
  appointmentMasterId: number;
  appointmentSetupId: number;
  appointmentTypeId: number;
  date: string;
  startTime: string;
  endTime: string;
  remainingSlots: number;
}

export interface AppointmentStatusFlags {
  isActive: boolean;
  isConfirmed: boolean;
  isCompleted: boolean;
  isCanceled: boolean;
  cancelReason: string | null;
}

export interface CreateAppointmentResponse {
  reply: string;
  booking: {
    id: number;
    uniqueId: string;
    appointmentMasterId: number;
    appointmentSetupId: number;
    appointmentTypeId: number;
    date: string;
    startTime: string;
    endTime: string;
    status: AppointmentStatusFlags;
  };
  sessionId: string;
}

export interface TrackedAppointment {
  uniqueId: string;
  appointmentType: AppointmentTypeOption;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatusFlags;
}
