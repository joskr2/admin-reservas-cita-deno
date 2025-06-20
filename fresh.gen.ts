// DO NOT EDIT. This file is generated by Fresh.
// This file SHOULD be checked into source version control.
// This file is automatically updated during development when running `dev.ts`.

import * as $_404 from "./routes/_404.tsx";
import * as $_app from "./routes/_app.tsx";
import * as $_layout from "./routes/_layout.tsx";
import * as $_middleware from "./routes/_middleware.ts";
import * as $api_appointments_id_delete from "./routes/api/appointments/[id]/delete.ts";
import * as $api_appointments_id_update from "./routes/api/appointments/[id]/update.ts";
import * as $api_appointments_create from "./routes/api/appointments/create.ts";
import * as $api_appointments_index from "./routes/api/appointments/index.ts";
import * as $api_appointments_quick_book from "./routes/api/appointments/quick-book.ts";
import * as $api_auth_check from "./routes/api/auth/check.ts";
import * as $api_auth_clear_cookies from "./routes/api/auth/clear-cookies.ts";
import * as $api_auth_login from "./routes/api/auth/login.ts";
import * as $api_auth_logout from "./routes/api/auth/logout.ts";
import * as $api_patients_id_ from "./routes/api/patients/[id].ts";
import * as $api_patients_by_psychologist_email_ from "./routes/api/patients/by-psychologist/[email].ts";
import * as $api_patients_index from "./routes/api/patients/index.ts";
import * as $api_rooms_id_delete from "./routes/api/rooms/[id]/delete.ts";
import * as $api_rooms_id_toggle_availability from "./routes/api/rooms/[id]/toggle-availability.ts";
import * as $api_rooms_id_update from "./routes/api/rooms/[id]/update.ts";
import * as $api_rooms_create from "./routes/api/rooms/create.ts";
import * as $api_rooms_index from "./routes/api/rooms/index.ts";
import * as $appointments_id_ from "./routes/appointments/[id].tsx";
import * as $appointments_calendar from "./routes/appointments/calendar.tsx";
import * as $appointments_edit_id_ from "./routes/appointments/edit/[id].tsx";
import * as $appointments_index from "./routes/appointments/index.tsx";
import * as $appointments_new from "./routes/appointments/new.tsx";
import * as $dashboard_index from "./routes/dashboard/index.tsx";
import * as $index from "./routes/index.tsx";
import * as $login from "./routes/login.tsx";
import * as $patients_id_ from "./routes/patients/[id].tsx";
import * as $patients_delete_id_ from "./routes/patients/delete/[id].tsx";
import * as $patients_edit_id_ from "./routes/patients/edit/[id].tsx";
import * as $patients_index from "./routes/patients/index.tsx";
import * as $patients_new from "./routes/patients/new.tsx";
import * as $psychologists_delete_id_ from "./routes/psychologists/delete/[id].tsx";
import * as $psychologists_edit_id_ from "./routes/psychologists/edit/[id].tsx";
import * as $psychologists_index from "./routes/psychologists/index.tsx";
import * as $psychologists_new from "./routes/psychologists/new.tsx";
import * as $rooms_id_ from "./routes/rooms/[id].tsx";
import * as $rooms_edit_id_ from "./routes/rooms/edit/[id].tsx";
import * as $rooms_index from "./routes/rooms/index.tsx";
import * as $rooms_new from "./routes/rooms/new.tsx";
import * as $AppointmentCalendar from "./islands/AppointmentCalendar.tsx";
import * as $AppointmentDetailsDropdown from "./islands/AppointmentDetailsDropdown.tsx";
import * as $AppointmentDetailsModal from "./islands/AppointmentDetailsModal.tsx";
import * as $AppointmentFilters from "./islands/AppointmentFilters.tsx";
import * as $AppointmentForm from "./islands/AppointmentForm.tsx";
import * as $AppointmentFormValidator from "./islands/AppointmentFormValidator.tsx";
import * as $AppointmentStatusSelector from "./islands/AppointmentStatusSelector.tsx";
import * as $AvailabilityDashboard from "./islands/AvailabilityDashboard.tsx";
import * as $CollapsibleSection from "./islands/CollapsibleSection.tsx";
import * as $Counter from "./islands/Counter.tsx";
import * as $DashboardStats from "./islands/DashboardStats.tsx";
import * as $DeleteAppointmentButton from "./islands/DeleteAppointmentButton.tsx";
import * as $DeleteRoomButton from "./islands/DeleteRoomButton.tsx";
import * as $GenericFilters from "./islands/GenericFilters.tsx";
import * as $Header from "./islands/Header.tsx";
import * as $InteractiveCalendar from "./islands/InteractiveCalendar.tsx";
import * as $PatientSearchSelect from "./islands/PatientSearchSelect.tsx";
import * as $PatientSelect from "./islands/PatientSelect.tsx";
import * as $PsychologistFilters from "./islands/PsychologistFilters.tsx";
import * as $QuickBookingModal from "./islands/QuickBookingModal.tsx";
import * as $RoomFilters from "./islands/RoomFilters.tsx";
import * as $RoomToggleButton from "./islands/RoomToggleButton.tsx";
import * as $SpecialtySelector from "./islands/SpecialtySelector.tsx";
import * as $ThemeToggle from "./islands/ThemeToggle.tsx";
import * as $Toast from "./islands/Toast.tsx";
import { type Manifest } from "$fresh/server.ts";

const manifest = {
  routes: {
    "./routes/_404.tsx": $_404,
    "./routes/_app.tsx": $_app,
    "./routes/_layout.tsx": $_layout,
    "./routes/_middleware.ts": $_middleware,
    "./routes/api/appointments/[id]/delete.ts": $api_appointments_id_delete,
    "./routes/api/appointments/[id]/update.ts": $api_appointments_id_update,
    "./routes/api/appointments/create.ts": $api_appointments_create,
    "./routes/api/appointments/index.ts": $api_appointments_index,
    "./routes/api/appointments/quick-book.ts": $api_appointments_quick_book,
    "./routes/api/auth/check.ts": $api_auth_check,
    "./routes/api/auth/clear-cookies.ts": $api_auth_clear_cookies,
    "./routes/api/auth/login.ts": $api_auth_login,
    "./routes/api/auth/logout.ts": $api_auth_logout,
    "./routes/api/patients/[id].ts": $api_patients_id_,
    "./routes/api/patients/by-psychologist/[email].ts":
      $api_patients_by_psychologist_email_,
    "./routes/api/patients/index.ts": $api_patients_index,
    "./routes/api/rooms/[id]/delete.ts": $api_rooms_id_delete,
    "./routes/api/rooms/[id]/toggle-availability.ts":
      $api_rooms_id_toggle_availability,
    "./routes/api/rooms/[id]/update.ts": $api_rooms_id_update,
    "./routes/api/rooms/create.ts": $api_rooms_create,
    "./routes/api/rooms/index.ts": $api_rooms_index,
    "./routes/appointments/[id].tsx": $appointments_id_,
    "./routes/appointments/calendar.tsx": $appointments_calendar,
    "./routes/appointments/edit/[id].tsx": $appointments_edit_id_,
    "./routes/appointments/index.tsx": $appointments_index,
    "./routes/appointments/new.tsx": $appointments_new,
    "./routes/dashboard/index.tsx": $dashboard_index,
    "./routes/index.tsx": $index,
    "./routes/login.tsx": $login,
    "./routes/patients/[id].tsx": $patients_id_,
    "./routes/patients/delete/[id].tsx": $patients_delete_id_,
    "./routes/patients/edit/[id].tsx": $patients_edit_id_,
    "./routes/patients/index.tsx": $patients_index,
    "./routes/patients/new.tsx": $patients_new,
    "./routes/psychologists/delete/[id].tsx": $psychologists_delete_id_,
    "./routes/psychologists/edit/[id].tsx": $psychologists_edit_id_,
    "./routes/psychologists/index.tsx": $psychologists_index,
    "./routes/psychologists/new.tsx": $psychologists_new,
    "./routes/rooms/[id].tsx": $rooms_id_,
    "./routes/rooms/edit/[id].tsx": $rooms_edit_id_,
    "./routes/rooms/index.tsx": $rooms_index,
    "./routes/rooms/new.tsx": $rooms_new,
  },
  islands: {
    "./islands/AppointmentCalendar.tsx": $AppointmentCalendar,
    "./islands/AppointmentDetailsDropdown.tsx": $AppointmentDetailsDropdown,
    "./islands/AppointmentDetailsModal.tsx": $AppointmentDetailsModal,
    "./islands/AppointmentFilters.tsx": $AppointmentFilters,
    "./islands/AppointmentForm.tsx": $AppointmentForm,
    "./islands/AppointmentFormValidator.tsx": $AppointmentFormValidator,
    "./islands/AppointmentStatusSelector.tsx": $AppointmentStatusSelector,
    "./islands/AvailabilityDashboard.tsx": $AvailabilityDashboard,
    "./islands/CollapsibleSection.tsx": $CollapsibleSection,
    "./islands/Counter.tsx": $Counter,
    "./islands/DashboardStats.tsx": $DashboardStats,
    "./islands/DeleteAppointmentButton.tsx": $DeleteAppointmentButton,
    "./islands/DeleteRoomButton.tsx": $DeleteRoomButton,
    "./islands/GenericFilters.tsx": $GenericFilters,
    "./islands/Header.tsx": $Header,
    "./islands/InteractiveCalendar.tsx": $InteractiveCalendar,
    "./islands/PatientSearchSelect.tsx": $PatientSearchSelect,
    "./islands/PatientSelect.tsx": $PatientSelect,
    "./islands/PsychologistFilters.tsx": $PsychologistFilters,
    "./islands/QuickBookingModal.tsx": $QuickBookingModal,
    "./islands/RoomFilters.tsx": $RoomFilters,
    "./islands/RoomToggleButton.tsx": $RoomToggleButton,
    "./islands/SpecialtySelector.tsx": $SpecialtySelector,
    "./islands/ThemeToggle.tsx": $ThemeToggle,
    "./islands/Toast.tsx": $Toast,
  },
  baseUrl: import.meta.url,
} satisfies Manifest;

export default manifest;
