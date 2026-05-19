import { saveFacilityAction } from "./actions";
import type { Facility, IndoorOutdoor, LiveStatus, PublicPrivate, SourcePlatform, Sport } from "@/types/domain";
import { getLiveStatusLabel, getSourcePlatformLabel } from "@/lib/facilities";

const sports: Sport[] = ["tennis", "pickleball"];
const indoorOutdoorValues: IndoorOutdoor[] = ["indoor", "outdoor", "both"];
const publicPrivateValues: PublicPrivate[] = ["public", "private", "public_private"];
const liveStatuses: LiveStatus[] = ["live_alerts", "manual_beta", "booking_link_only", "coming_soon"];
const sourcePlatforms: SourcePlatform[] = [
  "manual",
  "courtreserve",
  "playbypoint",
  "webtrac",
  "activenet",
  "civicrec",
  "unknown"
];

export function FacilityForm({ facility }: { facility?: Facility }) {
  return (
    <form className="form panel" action={saveFacilityAction}>
      <input name="id" type="hidden" defaultValue={facility?.id ?? ""} />

      <div className="grid two">
        <label className="field" htmlFor="name">
          <span>Name</span>
          <input id="name" name="name" required defaultValue={facility?.name ?? ""} />
        </label>
        <label className="field" htmlFor="slug">
          <span>Slug</span>
          <input id="slug" name="slug" required defaultValue={facility?.slug ?? ""} />
        </label>
      </div>

      <label className="field" htmlFor="address">
        <span>Address</span>
        <input id="address" name="address" required defaultValue={facility?.address ?? ""} />
      </label>

      <div className="grid two">
        <label className="field" htmlFor="city">
          <span>City</span>
          <input id="city" name="city" required defaultValue={facility?.city ?? ""} />
        </label>
        <label className="field" htmlFor="neighborhood">
          <span>Neighborhood</span>
          <input id="neighborhood" name="neighborhood" required defaultValue={facility?.neighborhood ?? ""} />
        </label>
      </div>

      <div className="grid two">
        <label className="field" htmlFor="latitude">
          <span>Latitude</span>
          <input id="latitude" name="latitude" required type="number" step="0.0001" defaultValue={facility?.latitude ?? 0} />
        </label>
        <label className="field" htmlFor="longitude">
          <span>Longitude</span>
          <input id="longitude" name="longitude" required type="number" step="0.0001" defaultValue={facility?.longitude ?? 0} />
        </label>
      </div>

      <fieldset className="fieldset">
        <legend>Sports</legend>
        <div className="channel-row">
          {sports.map((sport) => (
            <label className="check-option compact" key={sport}>
              <input name="sports" type="checkbox" value={sport} defaultChecked={facility?.sports.includes(sport) ?? sport === "tennis"} />
              <span>{sport}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid two">
        <label className="field" htmlFor="numberOfCourts">
          <span>Number of courts</span>
          <input id="numberOfCourts" name="numberOfCourts" min="0" required type="number" defaultValue={facility?.numberOfCourts ?? 1} />
        </label>
        <label className="field" htmlFor="indoorOutdoor">
          <span>Indoor/outdoor</span>
          <select id="indoorOutdoor" name="indoorOutdoor" defaultValue={facility?.indoorOutdoor ?? "outdoor"}>
            {indoorOutdoorValues.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid two">
        <label className="field" htmlFor="publicPrivate">
          <span>Public/private</span>
          <select id="publicPrivate" name="publicPrivate" defaultValue={facility?.publicPrivate ?? "public"}>
            {publicPrivateValues.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="check-option compact admin-checkbox">
          <input name="lights" type="checkbox" defaultChecked={facility?.lights ?? true} />
          <span>Lights</span>
        </label>
      </div>

      <div className="grid two">
        <label className="field" htmlFor="liveStatus">
          <span>Live status</span>
          <select id="liveStatus" name="liveStatus" defaultValue={facility?.liveStatus ?? "coming_soon"}>
            {liveStatuses.map((status) => (
              <option key={status} value={status}>
                {getLiveStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>
        <label className="field" htmlFor="sourcePlatform">
          <span>Source platform</span>
          <select id="sourcePlatform" name="sourcePlatform" defaultValue={facility?.sourcePlatform ?? "unknown"}>
            {sourcePlatforms.map((platform) => (
              <option key={platform} value={platform}>
                {getSourcePlatformLabel(platform)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="field" htmlFor="bookingUrl">
        <span>Booking URL</span>
        <input id="bookingUrl" name="bookingUrl" required defaultValue={facility?.bookingUrl ?? "https://example.com/TODO-booking-url"} />
      </label>

      <label className="field" htmlFor="sourceUrl">
        <span>Source URL</span>
        <input id="sourceUrl" name="sourceUrl" required defaultValue={facility?.sourceUrl ?? "TODO: verify official facility source URL"} />
      </label>

      <label className="field" htmlFor="notes">
        <span>Notes</span>
        <textarea id="notes" name="notes" rows={4} defaultValue={facility?.notes ?? ""} />
      </label>

      <button className="button button-primary" type="submit">
        Save facility
      </button>
    </form>
  );
}
