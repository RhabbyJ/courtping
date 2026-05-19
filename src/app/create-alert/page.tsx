import { redirect } from "next/navigation";
import { canCreateAlert } from "@/lib/billing/gating";
import { getMonitoringMessage, isLiveAlertReady } from "@/lib/facilities";
import {
  createAlert,
  getDemoUser,
  getSubscriptionForUser,
  listAlertsForUser,
  listCourts,
  listVenues,
} from "@/lib/data/store";
import { validateCreateAlertInput } from "@/lib/data/validation";
import type { NotificationChannel, Sport } from "@/types/domain";

const days = [
  ["0", "Sun"],
  ["1", "Mon"],
  ["2", "Tue"],
  ["3", "Wed"],
  ["4", "Thu"],
  ["5", "Fri"],
  ["6", "Sat"],
];

async function createAlertAction(formData: FormData) {
  "use server";

  const raw = {
    venueId: String(formData.get("venueId") ?? ""),
    courtId: String(formData.get("courtId") ?? ""),
    sport: String(formData.get("sport") ?? "") as Sport,
    daysOfWeek: formData.getAll("daysOfWeek").map(Number),
    startTime: String(formData.get("startTime") ?? ""),
    endTime: String(formData.get("endTime") ?? ""),
    channels: formData.getAll("channels").map(String) as NotificationChannel[],
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
  };
  const validation = validateCreateAlertInput(raw);

  if (!validation.ok) {
    redirect(`/create-alert?error=${encodeURIComponent(validation.errors.join(" "))}`);
  }

  const subscription = getSubscriptionForUser();
  const activeAlertCount = listAlertsForUser().filter((alert) => alert.active).length;
  const gate = canCreateAlert({ planTier: subscription.planTier, activeAlertCount });

  if (!gate.allowed) {
    redirect(`/pricing?notice=${encodeURIComponent(gate.reason)}`);
  }

  createAlert(validation.value);
  redirect("/my-alerts?created=1");
}

type CreateAlertPageProps = {
  searchParams?: Promise<{ error?: string; facility?: string }>;
};

export default async function CreateAlertPage({ searchParams }: CreateAlertPageProps) {
  const params = searchParams ? await searchParams : {};
  const venues = listVenues();
  const courts = listCourts();
  const user = getDemoUser();
  const requestedFacility = params.facility
    ? venues.find((venue) => venue.slug === params.facility)
    : undefined;
  const selectedFacility = requestedFacility ?? venues[0];
  const selectedCourt = courts.find((court) => court.venueId === selectedFacility.id) ?? courts[0];
  const selectedSport = selectedCourt?.sport ?? selectedFacility.sports[0] ?? "tennis";

  return (
    <main className="app-shell">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Create alert</p>
          <h1>Create a court alert</h1>
          <p>
            Pick one court, choose the days you can play, and set a time window. When a matching opening appears,
            CourtPing can notify you so you can book on the official site.
          </p>
        </div>
      </section>

      {params?.error ? <div className="notice notice-danger">{params.error}</div> : null}
      {selectedFacility && !isLiveAlertReady(selectedFacility.liveStatus) ? (
        <div className="notice">{getMonitoringMessage(selectedFacility.liveStatus)}</div>
      ) : null}

      <div className="form-layout">
        <form className="panel form-panel" action={createAlertAction}>
          <div className="panel-heading">
            <p className="eyebrow">Alert preferences</p>
            <h2>Court and timing</h2>
          </div>

          <div className="time-grid">
            <label className="field" htmlFor="sport">
              <span>Sport</span>
              <select id="sport" name="sport" defaultValue={selectedSport} required>
                <option value="tennis">Tennis</option>
                <option value="pickleball">Pickleball</option>
              </select>
            </label>
            <label className="field" htmlFor="venueId">
              <span>Venue</span>
              <select id="venueId" name="venueId" defaultValue={selectedFacility.id} required>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="field" htmlFor="courtId">
            <span>Court</span>
            <select id="courtId" name="courtId" defaultValue={selectedCourt?.id} required>
              {venues.map((venue) => (
                <optgroup key={venue.id} label={venue.name}>
                  {courts
                    .filter((court) => court.venueId === venue.id)
                    .map((court) => (
                      <option key={court.id} value={court.id}>
                        {court.name} - {court.sport}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </label>

          <fieldset className="fieldset">
            <legend>Days</legend>
            <div className="day-grid">
              {days.map(([value, label]) => (
                <label className="day-option" key={value}>
                  <input
                    name="daysOfWeek"
                    type="checkbox"
                    value={value}
                    defaultChecked={value === "1"}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="time-grid">
            <label className="field" htmlFor="startTime">
              <span>Start</span>
              <input id="startTime" name="startTime" type="time" defaultValue="17:00" required />
            </label>
            <label className="field" htmlFor="endTime">
              <span>End</span>
              <input id="endTime" name="endTime" type="time" defaultValue="19:00" required />
            </label>
          </div>

          <fieldset className="fieldset">
            <legend>Notifications</legend>
            <div className="channel-row">
              <label className="check-option compact">
                <input name="channels" type="checkbox" value="sms" defaultChecked />
                <span>Text message</span>
              </label>
              <label className="check-option compact">
                <input name="channels" type="checkbox" value="email" />
                <span>Email</span>
              </label>
            </div>
          </fieldset>

          <div className="time-grid">
            <label className="field" htmlFor="phone">
              <span>Phone</span>
              <input id="phone" name="phone" type="tel" defaultValue={user.phone ?? ""} />
            </label>
            <label className="field" htmlFor="email">
              <span>Email</span>
              <input id="email" name="email" type="email" defaultValue={user.email} />
            </label>
          </div>

          <button className="button button-primary full-width" type="submit">
            Create alert
          </button>
        </form>

        <aside className="panel summary-panel">
          <div className="panel-heading">
            <p className="eyebrow">Facilities</p>
            <h2>Courts you can track</h2>
          </div>

          <div className="mini-list">
            {venues.map((venue) => (
              <div key={venue.id}>
                <strong>{venue.name}</strong>
                <span>
                  {venue.neighborhood}, {venue.city} -{" "}
                  {courts.filter((court) => court.venueId === venue.id).length} courts
                </span>
              </div>
            ))}
          </div>

          <div className="mock-note">
            <strong>{selectedFacility.name}</strong>
            <span>{getMonitoringMessage(selectedFacility.liveStatus)}</span>
          </div>
        </aside>
      </div>
    </main>
  );
}
