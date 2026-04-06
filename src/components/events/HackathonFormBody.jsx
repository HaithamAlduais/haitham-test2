import { useLanguage } from "../../context/LanguageContext";

const INPUT_CLASS = "w-full border-2 border-border px-2 py-1 font-mono text-sm bg-background text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-main";
const LABEL_CLASS = "text-sm font-heading leading-none text-muted-foreground";
const SECTION_TITLE = "text-sm font-heading leading-none text-foreground mb-2";
const ADD_BTN = "font-mono font-bold text-xs text-foreground border-2 border-border px-2 py-1 mt-1 hover:border-main transition-colors duration-100";

/**
 * Ramsha — HackathonFormBody
 *
 * The scrollable form content inside the HackathonDetailsModal.
 * Extracted to keep files under ~200 lines.
 */
const HackathonFormBody = ({
  form,
  showNameError,
  onFieldChange,
  onListChange,
  onAddRow,
  onRemoveRow,
}) => {
  const { t } = useLanguage();

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8">
      {/* Basic Info */}
      <section>
        <h3 className={SECTION_TITLE}>{t("basicInfo")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={LABEL_CLASS}>{t("hackathonName")}</label>
            <input name="name" value={form.name} onChange={onFieldChange} className={`${INPUT_CLASS} ${showNameError ? "!border-destructive" : ""}`} />
            {showNameError && <p className="font-mono text-xs text-destructive mt-1">{t("hackathonNameRequired")}</p>}
          </div>
          <div>
            <label className={LABEL_CLASS}>{t("tagline")}</label>
            <input name="tagline" value={form.tagline} onChange={onFieldChange} className={INPUT_CLASS} />
          </div>
          <div className="md:col-span-2">
            <label className={LABEL_CLASS}>{t("aboutDescription")}</label>
            <textarea name="description" value={form.description} onChange={onFieldChange} rows={3} className={INPUT_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>{t("startDate")}</label>
            <input type="date" name="startDate" value={form.startDate} onChange={onFieldChange} className={INPUT_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>{t("endDate")}</label>
            <input type="date" name="endDate" value={form.endDate} onChange={onFieldChange} className={INPUT_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>{t("registrationDeadline")}</label>
            <input type="date" name="regDeadline" value={form.regDeadline} onChange={onFieldChange} className={INPUT_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>{t("location")}</label>
            <input name="location" value={form.location} onChange={onFieldChange} className={INPUT_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>{t("format")}</label>
            <select name="format" value={form.format} onChange={onFieldChange} className={INPUT_CLASS}>
              <option value="In-Person">{t("inPerson")}</option>
              <option value="Online">{t("online")}</option>
              <option value="Hybrid">{t("hybrid")}</option>
            </select>
          </div>
          <div>
            <label className={LABEL_CLASS}>{t("maxTeamSize")}</label>
            <input name="maxTeamSize" value={form.maxTeamSize} onChange={onFieldChange} className={INPUT_CLASS} />
          </div>
        </div>
      </section>

      {/* Tracks */}
      <DynamicListSection
        title={t("tracks")}
        items={form.tracks}
        listKey="tracks"
        fields={[{ key: "name", placeholder: t("trackName") }, { key: "description", placeholder: t("trackDescription") }]}
        addLabel={t("addTrack")}
        newRow={{ name: "", description: "" }}
        onListChange={onListChange}
        onAddRow={onAddRow}
        onRemoveRow={onRemoveRow}
      />

      {/* Prizes */}
      <DynamicListSection
        title={t("prizes")}
        items={form.prizes}
        listKey="prizes"
        fields={[{ key: "label", placeholder: t("prizeLabel") }, { key: "value", placeholder: t("prizeValue") }]}
        addLabel={t("addPrize")}
        newRow={{ label: "", value: "" }}
        onListChange={onListChange}
        onAddRow={onAddRow}
        onRemoveRow={onRemoveRow}
      />

      {/* Schedule */}
      <DynamicListSection
        title={t("schedule")}
        items={form.schedule}
        listKey="schedule"
        fields={[{ key: "time", placeholder: t("timeDay") }, { key: "activity", placeholder: t("activity") }]}
        addLabel={t("addScheduleItem")}
        newRow={{ time: "", activity: "" }}
        onListChange={onListChange}
        onAddRow={onAddRow}
        onRemoveRow={onRemoveRow}
      />

      {/* Judges & Mentors */}
      <JudgesSection
        items={form.judges}
        onListChange={onListChange}
        onAddRow={onAddRow}
        onRemoveRow={onRemoveRow}
      />

      {/* Branding & Registration */}
      <section>
        <h3 className={SECTION_TITLE}>{t("brandingRegistration")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={LABEL_CLASS}>{t("primaryColor")}</label>
            <input type="color" name="primaryColor" value={form.primaryColor} onChange={onFieldChange} className="w-10 h-10 border-2 border-border bg-transparent" />
          </div>
          <div>
            <label className={LABEL_CLASS}>{t("accentColor")}</label>
            <input type="color" name="accentColor" value={form.accentColor} onChange={onFieldChange} className="w-10 h-10 border-2 border-border bg-transparent" />
          </div>
          <div className="md:col-span-2">
            <label className={LABEL_CLASS}>{t("sponsorsLabel")}</label>
            <input name="sponsors" value={form.sponsors} onChange={onFieldChange} className={INPUT_CLASS} />
          </div>
          <div className="md:col-span-2">
            <label className={LABEL_CLASS}>{t("registrationLink")}</label>
            <input name="regLink" value={form.regLink} onChange={onFieldChange} className={INPUT_CLASS} />
          </div>
        </div>
      </section>

    </div>
  );
};

/** Reusable dynamic list section (tracks, prizes, schedule). */
const DynamicListSection = ({ title, items, listKey, fields, addLabel, newRow, onListChange, onAddRow, onRemoveRow }) => (
  <section>
    <h3 className={SECTION_TITLE}>{title}</h3>
    {items.map((item, i) => (
      <div key={i} className="flex gap-2 mb-2 items-center">
        {fields.map((f) => (
          <input
            key={f.key}
            placeholder={f.placeholder}
            value={item[f.key]}
            onChange={(e) => onListChange(listKey, i, f.key, e.target.value)}
            className="border-2 border-border px-2 py-1 font-mono text-sm flex-1 bg-background text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-main"
          />
        ))}
        <button onClick={() => onRemoveRow(listKey, i)} className="text-destructive text-lg font-mono">×</button>
      </div>
    ))}
    <button onClick={() => onAddRow(listKey, newRow)} className={ADD_BTN}>{addLabel}</button>
  </section>
);

/** Judges & Mentors section with role select. */
const JudgesSection = ({ items, onListChange, onAddRow, onRemoveRow }) => {
  const { t } = useLanguage();
  return (
    <section>
      <h3 className={SECTION_TITLE}>{t("judgesMentors")}</h3>
      {items.map((person, i) => (
        <div key={i} className="flex gap-2 mb-2 items-center">
          <input placeholder={t("judgeName")} value={person.name} onChange={(e) => onListChange("judges", i, "name", e.target.value)} className="border-2 border-border px-2 py-1 font-mono text-sm flex-1 bg-background text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-main" />
          <input placeholder={t("judgeTitle")} value={person.title} onChange={(e) => onListChange("judges", i, "title", e.target.value)} className="border-2 border-border px-2 py-1 font-mono text-sm flex-1 bg-background text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-main" />
          <select value={person.role} onChange={(e) => onListChange("judges", i, "role", e.target.value)} className="border-2 border-border px-2 py-1 font-mono text-sm bg-background text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-main">
            <option value="Judge">{t("judge")}</option>
            <option value="Mentor">{t("mentor")}</option>
          </select>
          <button onClick={() => onRemoveRow("judges", i)} className="text-destructive text-lg font-mono">×</button>
        </div>
      ))}
      <button onClick={() => onAddRow("judges", { name: "", title: "", role: "Judge" })} className={ADD_BTN}>{t("addJudgeMentor")}</button>
    </section>
  );
};

export default HackathonFormBody;
