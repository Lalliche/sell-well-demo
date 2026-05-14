"use client";
import { useState, useRef } from "react";
import AppButton from "@/components/ui/Buttons";
import { TextInput, TextArea, DateInput, DropdownInput, FileInput } from "@/components/ui/FormInputs";
import StatusBadge from "@/components/shared/data-display/StatusBadge";
import StatCard from "@/components/shared/analytics/StatCard";
import StatCardBreakdown from "@/components/shared/analytics/StatCardBreakdown";
import EscrowWalletCard from "@/components/shared/analytics/EscrowWalletCard";
import EarningsBreakdownCard from "@/components/shared/analytics/EarningsBreakdownCard";
import PartnerLinkCard from "@/components/shared/analytics/PartnerLinkCard";
import ConversionFunnelCard from "@/components/shared/analytics/ConversionFunnelCard";
import DataTable from "@/components/shared/data-display/DataTable";
import FilterBar from "@/components/shared/layout/FilterBar";
import FilterPanel from "@/components/shared/overlays/FilterPanel";
import DetailOverlay from "@/components/shared/overlays/DetailOverlay";
import EmptyState from "@/components/shared/feedback/EmptyState";
import { SkeletonText, SkeletonAvatar, SkeletonCard, SkeletonTableRows, SkeletonStatRow } from "@/components/shared/data-display/Skeleton";
import ConfirmDialog from "@/components/shared/feedback/ConfirmDialog";
import { useToast } from "@/hooks/useToast";
import { FiBox, FiUsers, FiTrendingUp, FiCreditCard, FiAlertTriangle, FiFileText, FiMessageSquare, FiActivity, FiUser, FiSettings } from "react-icons/fi";

function Section({ title, children }) {
  return (
    <section className="flex flex-col gap-[1.25em]">
      <h2 className="font-heading text-[1.125em] font-bold text-text border-b border-border-light pb-[0.5em]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ children, wrap = false }) {
  return (
    <div className={`flex ${wrap ? "flex-wrap" : ""} items-start gap-[0.75em]`}>
      {children}
    </div>
  );
}

function Label({ children }) {
  return <p className="text-[0.75em] font-medium text-text-muted font-body uppercase tracking-wide mb-[0.25em]">{children}</p>;
}

const SAMPLE_ROWS = [
  { id: 1, name: "Ahmed Benali",   campaign: "Atlas CRM",   status: "converted",          commission: 12500, date: "2026-04-15" },
  { id: 2, name: "Sara Boudiaf",   campaign: "Digi-Compta",  status: "submitted",           commission: 8000,  date: "2026-04-18" },
  { id: 3, name: "Karim Messaoud", campaign: "CloudOps DZ",  status: "acknowledged",        commission: 15000, date: "2026-04-20" },
  { id: 4, name: "Lina Hamidi",    campaign: "PayMe Algeria", status: "rejected",            commission: 0,     date: "2026-04-22" },
  { id: 5, name: "Omar Tiziri",    campaign: "Atlas CRM",   status: "pending",             commission: 9500,  date: "2026-04-23" },
  { id: 6, name: "Nadia Saifi",    campaign: "Digi-Compta",  status: "expired",             commission: 0,     date: "2026-04-24" },
  { id: 7, name: "Yacine Amrani",  campaign: "CloudOps DZ",  status: "disputed_verifying",  commission: 11000, date: "2026-04-25" },
];

const TABLE_COLS = [
  { key: "name",       label: "Client",          sortable: true },
  { key: "campaign",   label: "Campaign",         sortable: true },
  { key: "status",     label: "Status",           render: (v) => <StatusBadge status={v} /> },
  { key: "commission", label: "Commission (DA)",  sortable: true, align: "right",
    render: (v) => <span className="font-mono tabular-nums">{v.toLocaleString()}</span> },
  { key: "date",       label: "Date",             sortable: true },
];

const DROPDOWN_OPTIONS = [
  { value: "crm",        label: "CRM" },
  { value: "erp",        label: "ERP" },
  { value: "accounting", label: "Accounting & Finance" },
  { value: "hr",         label: "HR & Payroll" },
  { value: "cloud",      label: "Cloud Infrastructure" },
];

const FILTER_CHIPS = [
  { key: "all",       label: "All",       count: 7 },
  { key: "active",    label: "Active",    count: 3 },
  { key: "pending",   label: "Pending",   count: 2 },
  { key: "converted", label: "Converted", count: 1 },
];

export default function ComponentTestPage() {
  const { toast } = useToast();

  const [btnLoading, setBtnLoading] = useState(false);
  const [textVal,     setTextVal]     = useState("");
  const [emailVal,    setEmailVal]    = useState("");
  const [passwordVal, setPasswordVal] = useState("");
  const [textareaVal, setTextareaVal] = useState("");
  const [dateVal,     setDateVal]     = useState("");
  const [dropVal,     setDropVal]     = useState(null);
  const [multiVal,    setMultiVal]    = useState([]);
  const [fileVal,     setFileVal]     = useState(null);
  const [search,      setSearch]      = useState("");
  const [activeChip,  setActiveChip]  = useState("all");
  const [confirmOpen,    setConfirmOpen]    = useState(false);
  const [destructiveOpen,setDestructiveOpen] = useState(false);
  const [reasonOpen,     setReasonOpen]     = useState(false);
  const [filterOpen,    setFilterOpen]    = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const filterTriggerRef                  = useRef(null);
  const [overlayOpen,   setOverlayOpen]   = useState(false);
  const [overlayActionsOpen, setOverlayActionsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg px-[2em] py-[2em]">
      <div className="max-w-[62em] mx-auto flex flex-col gap-[3em]">

        <div className="flex flex-col gap-[0.25em]">
          <h1 className="font-heading text-[2em] font-bold text-text">Component Test</h1>
          <p className="text-[0.875em] text-text-secondary font-body">
            Every shared UI component in every state. Test each one before marking Phase 2 done.
          </p>
        </div>

        {/* 1. AppButton */}
        <Section title="AppButton">
          <div className="flex flex-col gap-[1em]">
            <div>
              <Label>Variants</Label>
              <Row>
                <AppButton variant="primary">Primary</AppButton>
                <AppButton variant="accent">Accent</AppButton>
                <AppButton variant="secondary">Secondary</AppButton>
                <AppButton variant="ghost">Ghost</AppButton>
              </Row>
            </div>
            <div>
              <Label>Sizes</Label>
              <Row>
                <AppButton size="sm">Small</AppButton>
                <AppButton size="md">Medium</AppButton>
                <AppButton size="lg">Large</AppButton>
              </Row>
            </div>
            <div>
              <Label>States</Label>
              <Row>
                <AppButton disabled>Disabled</AppButton>
                <AppButton isLoading={btnLoading} onClick={() => { setBtnLoading(true); setTimeout(() => setBtnLoading(false), 2000); }}>
                  {btnLoading ? "Loading…" : "Click to Load"}
                </AppButton>
                <AppButton variant="secondary" disabled>Disabled Secondary</AppButton>
              </Row>
            </div>
          </div>
        </Section>

        {/* 2. StatusBadge */}
        <Section title="StatusBadge">
          <div className="flex flex-col gap-[1em]">
            <div>
              <Label>Lead statuses</Label>
              <Row wrap>
                {["submitted","pending_escrow","acknowledged","converted","converted_verified","not_converted","disputed_verifying","expired","expired_verifying"].map(s => (
                  <StatusBadge key={s} status={s} />
                ))}
              </Row>
            </div>
            <div>
              <Label>Application & Campaign</Label>
              <Row wrap>
                {["pending","approved","rejected","draft","active","paused","closed"].map(s => (
                  <StatusBadge key={s} status={s} />
                ))}
              </Row>
            </div>
            <div>
              <Label>Wallet transactions</Label>
              <Row wrap>
                {["deposit","reservation","release_commission","release_platform_fee","return","withdrawal"].map(s => (
                  <StatusBadge key={s} status={s} />
                ))}
              </Row>
            </div>
          </div>
        </Section>

        {/* 3. Analytics & Stat Cards */}
        <Section title="Analytics & Stat Cards">
          <div className="flex flex-col gap-[2em]">

            <div className="flex flex-col gap-[0.5em]">
              <Label>StatCard — overline label, mono value, trend arrow</Label>
              <p className="text-[0.75em] text-text-muted font-body">Props: label, value, trend?, trendLabel?, highlight?, icon?</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-[1em]">
                <StatCard label="Total Earned"     value="DZD 48,200" trend={12}  icon={<FiCreditCard size="1em" />} />
                <StatCard label="This Month"       value="DZD 9,500"  trend={-3}  icon={<FiTrendingUp size="1em" />} />
                <StatCard label="Active Campaigns" value="6"          trend={0}   icon={<FiBox size="1em" />} />
                <StatCard label="Sales Partners"   value="14"                     icon={<FiUsers size="1em" />} />
              </div>
            </div>

            <div className="flex flex-col gap-[0.5em]">
              <Label>StatCard + sparkline — Stripe / Mercury pattern, faint area behind value</Label>
              <p className="text-[0.75em] text-text-muted font-body">Adds optional `sparkline` prop (number[] or {`{value: number}`}[]). Tone follows trend direction: positive = accent, negative = trend-negative, neutral/no-trend = muted.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-[1em]">
                <StatCard
                  label="Total Earned"
                  value="DZD 48,200"
                  trend={12}
                  icon={<FiCreditCard size="1em" />}
                  sparkline={[12, 18, 14, 22, 26, 24, 30, 28, 34, 32, 40, 38, 44, 48]}
                />
                <StatCard
                  label="This Month"
                  value="DZD 9,500"
                  trend={-3}
                  icon={<FiTrendingUp size="1em" />}
                  sparkline={[44, 42, 40, 38, 36, 34, 36, 32, 30, 28, 30, 26, 24, 22]}
                />
                <StatCard
                  label="Available"
                  value="DZD 22,400"
                  highlight
                  trend={0}
                  icon={<FiBox size="1em" />}
                  sparkline={[20, 22, 21, 23, 22, 24, 23, 22, 24, 23, 22, 24, 23, 22]}
                />
                <StatCard
                  label="Pending"
                  value="DZD 5,800"
                  icon={<FiUsers size="1em" />}
                  sparkline={[5, 8, 7, 12, 10, 14, 12, 16, 14, 18, 16, 20, 18, 22]}
                />
              </div>
            </div>

            <div className="flex flex-col gap-[0.5em]">
              <Label>StatCardBreakdown — big number destructured into sub-values</Label>
              <p className="text-[0.75em] text-text-muted font-body">Props: label, value, items[], icon?, highlight?</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-[1em]">
                <StatCardBreakdown label="Total Leads" value="42" icon={<FiUsers size="1em" />}
                  items={[{ label: "Submitted", value: "18", color: "muted" }, { label: "Acknowledged", value: "12", color: "accent" }, { label: "Converted", value: "12", color: "positive" }]} />
                <StatCardBreakdown label="Platform Revenue" value="DZD 184,000" highlight
                  items={[{ label: "This month", value: "DZD 28,400", color: "accent" }, { label: "All time", value: "DZD 184,000" }]} />
                <StatCardBreakdown label="Total Users" value="312"
                  items={[{ label: "Companies", value: "48" }, { label: "Sales Partners", value: "264", color: "accent" }]} />
              </div>
            </div>

            <div className="flex flex-col gap-[0.5em]">
              <Label>EscrowWalletCard — 4 health states (active / moderate / low / at-risk)</Label>
              <p className="text-[0.75em] text-text-muted font-body">Props: available, reserved, deposited, onFund?, onWithdraw?</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[1em]">
                <EscrowWalletCard available={180000} reserved={20000}  deposited={200000} />
                <EscrowWalletCard available={90000}  reserved={60000}  deposited={150000} />
                <EscrowWalletCard available={25000}  reserved={75000}  deposited={100000} />
                <EscrowWalletCard available={4000}   reserved={96000}  deposited={100000} />
              </div>
            </div>

            <div className="flex flex-col gap-[0.5em]">
              <Label>EarningsBreakdownCard — Sales Partner earnings with withdraw CTA</Label>
              <p className="text-[0.75em] text-text-muted font-body">Props: available, pending, withdrawn, onWithdraw?, bankingSetup?</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[1em]">
                <EarningsBreakdownCard available={48200} pending={9500} withdrawn={32000} bankingSetup />
                <EarningsBreakdownCard available={0}     pending={12000} withdrawn={8000} bankingSetup={false} />
              </div>
            </div>

            <div className="flex flex-col gap-[0.5em]">
              <Label>PartnerLinkCard — per-link analytics with copy + conversion bar</Label>
              <p className="text-[0.75em] text-text-muted font-body">Props: campaign, url, clicks, conversions, commission, onCopy?</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[1em]">
                <PartnerLinkCard campaign="Atlas CRM"  url="sellwell.dz/p/atlas-crm?ref=a7x9k2"  clicks={340} conversions={28} commission={33600} />
                <PartnerLinkCard campaign="Digi-Compta" url="sellwell.dz/p/digi-compta?ref=a7x9k2" clicks={12}  conversions={0}  commission={0} />
              </div>
            </div>

            <div className="flex flex-col gap-[0.5em]">
              <Label>ConversionFunnelCard — lead pipeline with drop-off rates</Label>
              <p className="text-[0.75em] text-text-muted font-body">Props: stages[] (label, count), title?</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[1em]">
                <ConversionFunnelCard stages={[{ label: "Submitted", count: 84 }, { label: "Acknowledged", count: 61 }, { label: "Converted", count: 24 }]} />
                <ConversionFunnelCard title="This Month" stages={[{ label: "Submitted", count: 18 }, { label: "Acknowledged", count: 14 }, { label: "Converted", count: 6 }]} />
              </div>
            </div>

          </div>
        </Section>

        {/* 4. FilterBar */}
        <Section title="FilterBar">
          <div className="flex flex-col gap-[1em]">
            <div className="relative">
              <Label>With search + chips + filter button + right slot</Label>
              <FilterBar
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search leads..."
                chips={FILTER_CHIPS}
                activeChip={activeChip}
                onChipClick={setActiveChip}
                onFilterClick={() => setFilterOpen((v) => !v)}
                activeFilterCount={Object.values(activeFilters).flat().length}
                filterTriggerRef={filterTriggerRef}
                rightSlot={<AppButton size="sm" variant="secondary">Export</AppButton>}
              />
              <FilterPanel
                triggerRef={filterTriggerRef}
                open={filterOpen}
                onClose={() => setFilterOpen(false)}
                onApply={(vals) => { setActiveFilters(vals); toast.success("Filters applied"); }}
                onReset={() => { setActiveFilters({}); toast.info("Filters reset"); }}
                activeCount={Object.values(activeFilters).flat().length}
                initialValues={activeFilters}
                sections={[
                  { key: "category", label: "Category", type: "chips", options: DROPDOWN_OPTIONS },
                  { key: "commission_type", label: "Commission type", type: "chips",
                    options: [{ value: "percentage", label: "Percentage" }, { value: "flat", label: "Flat amount" }] },
                  { key: "commission_range", label: "Commission range (DA)", type: "range", min: 0, max: 100000, step: 1000, unit: "DA" },
                ]}
              />
            </div>
            <div>
              <Label>Search only</Label>
              <FilterBar search="" onSearchChange={() => {}} searchPlaceholder="Search campaigns..." />
            </div>
          </div>
        </Section>

        {/* 5. DataTable */}
        <Section title="DataTable">
          <div className="flex flex-col gap-[1em]">
            <div>
              <Label>With data, sortable, paginated</Label>
              <DataTable
                columns={TABLE_COLS}
                rows={SAMPLE_ROWS}
                pageSize={5}
                actions={(row) => (
                  <AppButton size="sm" variant="secondary" onClick={() => toast.info(`Viewing: ${row.name}`)}>View</AppButton>
                )}
              />
            </div>
            <div>
              <Label>Loading state</Label>
              <DataTable columns={TABLE_COLS} rows={[]} isLoading skeletonRows={4} />
            </div>
            <div>
              <Label>Empty state</Label>
              <DataTable
                columns={TABLE_COLS}
                rows={[]}
                emptyTitle="No leads yet"
                emptySubtitle="Leads you submit will appear here once you apply to a campaign."
                emptyAction={<AppButton size="sm">Browse Marketplace</AppButton>}
              />
            </div>
          </div>
        </Section>

        {/* 6. EmptyState */}
        <Section title="EmptyState">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[1em]">
            <div className="border border-border-light rounded-[0.625em] bg-surface">
              <EmptyState
                icon={<FiBox strokeWidth={1.5} />}
                title="No campaigns yet"
                subtitle="Create your first campaign to start receiving sales partners."
                action={<AppButton size="sm">Create Campaign</AppButton>}
              />
            </div>
            <div className="border border-border-light rounded-[0.625em] bg-surface">
              <EmptyState
                icon={<FiAlertTriangle strokeWidth={1.5} />}
                title="No results match your filters"
                subtitle="Try adjusting your search or clearing filters."
              />
            </div>
          </div>
        </Section>

        {/* 7. Skeleton */}
        <Section title="Skeleton">
          <div className="flex flex-col gap-[1.25em]">
            <div>
              <Label>Stat row</Label>
              <SkeletonStatRow count={4} />
            </div>
            <div>
              <Label>Text lines</Label>
              <div className="flex flex-col gap-[0.625em] max-w-[24em]">
                <SkeletonText width="80%" />
                <SkeletonText width="60%" />
                <SkeletonText width="40%" />
              </div>
            </div>
            <div>
              <Label>Avatar + text</Label>
              <div className="flex items-center gap-[0.75em]">
                <SkeletonAvatar size="2.5em" />
                <div className="flex flex-col gap-[0.5em] flex-1">
                  <SkeletonText width="40%" />
                  <SkeletonText width="25%" />
                </div>
              </div>
            </div>
            <div>
              <Label>Cards</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-[1em]">
                <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
              </div>
            </div>
            <div>
              <Label>Table rows</Label>
              <div className="bg-surface border border-border-light rounded-[0.625em] overflow-hidden">
                <table className="w-full">
                  <tbody><SkeletonTableRows rows={4} cols={5} /></tbody>
                </table>
              </div>
            </div>
          </div>
        </Section>

        {/* 8. Form Inputs */}
        <Section title="Form Inputs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[1em]">
            <TextInput label="Full name"   value={textVal}     onChange={setTextVal}     placeholder="Enter your name" required />
            <TextInput label="Email"       value={emailVal}    onChange={setEmailVal}    placeholder="you@example.com" type="email" />
            <TextInput label="Password"    value={passwordVal} onChange={setPasswordVal} placeholder="Min 8 characters" type="password" />
            <TextInput label="With error"  value="" onChange={() => {}} errorMessage="This field is required." required />
            <TextInput label="Disabled"    value="Read-only value" onChange={() => {}} disabled />
            <TextInput label="With helper" value={textVal} onChange={setTextVal} placeholder="LinkedIn URL" helperText="Must be a valid linkedin.com profile URL" />
          </div>
          <div>
            <Label>TextArea</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[1em]">
              <TextArea label="Conversation notes" value={textareaVal} onChange={setTextareaVal} placeholder="What was discussed..." rows={4} maxLength={1000} required />
              <TextArea label="With error" value="" onChange={() => {}} errorMessage="Notes are required before submitting." rows={4} />
            </div>
          </div>
          <div>
            <Label>DateInput</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[1em]">
              <DateInput label="Sale date"  value={dateVal} onChange={setDateVal} />
              <DateInput label="With range" value={dateVal} onChange={setDateVal} minDate="2026-01-01" maxDate="2026-12-31" helperText="Between Jan and Dec 2026" />
            </div>
          </div>
          <div>
            <Label>DropdownInput</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[1em]">
              <DropdownInput label="Category (single)"   options={DROPDOWN_OPTIONS} value={dropVal}  onChange={setDropVal}  placeholder="Select a category" />
              <DropdownInput label="Categories (multi)"  options={DROPDOWN_OPTIONS} value={multiVal} onChange={setMultiVal} multi placeholder="Select categories" />
              <DropdownInput label="With error"          options={DROPDOWN_OPTIONS} value={null}     onChange={() => {}}    errorMessage="Please select a category." />
              <DropdownInput label="Disabled"            options={DROPDOWN_OPTIONS} value="crm"      onChange={() => {}}    disabled />
            </div>
          </div>
          <div>
            <Label>FileInput</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[1em]">
              <FileInput label="CV upload"  value={fileVal} onChange={setFileVal} accept=".pdf,.docx" maxSizeMb={10} helperText="PDF or DOCX, max 10MB" required />
              <FileInput label="With error" value={null}    onChange={() => {}}   accept="image/*" errorMessage="Please upload a valid image." />
            </div>
          </div>
        </Section>

        {/* 9. ConfirmDialog */}
        <Section title="ConfirmDialog">
          <Row>
            <div className="flex flex-col gap-[0.25em]">
              <Label>Default</Label>
              <AppButton variant="secondary" onClick={() => setConfirmOpen(true)}>Open Dialog</AppButton>
            </div>
            <div className="flex flex-col gap-[0.25em]">
              <Label>Destructive</Label>
              <AppButton variant="secondary" onClick={() => setDestructiveOpen(true)}>Open Destructive</AppButton>
            </div>
            <div className="flex flex-col gap-[0.25em]">
              <Label>With reason</Label>
              <AppButton variant="secondary" onClick={() => setReasonOpen(true)}>Open With Reason</AppButton>
            </div>
          </Row>
          <ConfirmDialog
            open={confirmOpen} onCancel={() => setConfirmOpen(false)}
            onConfirm={() => { toast.success("Action confirmed"); setConfirmOpen(false); }}
            title="Confirm sale"
            description="Are you sure you want to mark this lead as converted? This will release the commission to the Sales Partner."
            confirmLabel="Confirm Sale"
          />
          <ConfirmDialog
            open={destructiveOpen} onCancel={() => setDestructiveOpen(false)}
            onConfirm={() => { toast.error("User suspended", { title: "Action taken" }); setDestructiveOpen(false); }}
            title="Suspend user"
            description="This will prevent the user from accessing the platform. They can be unsuspended later."
            confirmLabel="Suspend" destructive
          />
          <ConfirmDialog
            open={reasonOpen} onCancel={() => setReasonOpen(false)}
            onConfirm={(reason) => { toast.warning(`Denied: ${reason}`); setReasonOpen(false); }}
            title="Did not convert"
            description="Please provide a reason. SellWell may contact the client to verify."
            confirmLabel="Submit" requireReason
            reasonLabel="Reason for denial"
            reasonPlaceholder="e.g. Client decided not to purchase at this time..."
          />
        </Section>

        {/* 10. DetailOverlay */}
        <Section title="DetailOverlay">
          <Row>
            <div className="flex flex-col gap-[0.25em]">
              <Label>Read-only detail</Label>
              <AppButton variant="secondary" onClick={() => setOverlayOpen(true)}>Open Lead Detail</AppButton>
            </div>
            <div className="flex flex-col gap-[0.25em]">
              <Label>With actions</Label>
              <AppButton variant="secondary" onClick={() => setOverlayActionsOpen(true)}>Open Application Review</AppButton>
            </div>
          </Row>

          {/* Lead detail — read only */}
          <DetailOverlay
            open={overlayOpen}
            onClose={() => setOverlayOpen(false)}
            title="Ahmed Benali"
            subtitle="Atlas CRM · Submitted Apr 15"
            avatar={
              <div className="w-[2.5em] h-[2.5em] rounded-full bg-accent-light flex items-center justify-center text-accent font-semibold text-[0.875em]">AB</div>
            }
            sections={[
              {
                key: "overview", label: "Overview", icon: <FiUser size="0.875em" />,
                content: (
                  <div className="grid grid-cols-2 gap-x-[2em] gap-y-[1.25em] text-[0.875em]">
                    {[["Client","Ahmed Benali"],["Company","Tech Algérie SARL"],["Campaign","Atlas CRM"],["Tier","Pro — DZD 120,000"],["Commission","DZD 12,000"],["Status",null]].map(([k,v]) => (
                      <div key={k}>
                        <p className="text-[0.8125em] text-text-muted mb-[0.25em]">{k}</p>
                        {k === "Status" ? <StatusBadge status="acknowledged" /> : <p className="text-text font-medium">{v}</p>}
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                key: "notes", label: "Conversation Notes", icon: <FiMessageSquare size="0.875em" />,
                content: (
                  <p className="text-[0.875em] text-text-secondary leading-[1.7]">
                    Client expressed strong interest in automating their dispatch operations. Ready to start a trial next week. Budget approved by the IT director. Asked about multi-site support — confirmed it's available on the Pro plan.
                  </p>
                ),
              },
              {
                key: "activity", label: "Activity", icon: <FiActivity size="0.875em" />,
                content: (
                  <div className="flex flex-col gap-[0.875em]">
                    {[
                      { date: "Apr 15", text: "Lead submitted by Ahmed Benali" },
                      { date: "Apr 16", text: "Company viewed lead — escrow reserved" },
                      { date: "Apr 18", text: "Tracking window started (30 days)" },
                    ].map((e) => (
                      <div key={e.date} className="flex gap-[1em] text-[0.8125em]">
                        <span className="text-text-muted font-mono shrink-0 w-[3em]">{e.date}</span>
                        <span className="text-text-secondary">{e.text}</span>
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                key: "long", label: "Long Content", icon: <FiFileText size="0.875em" />,
                content: (
                  <div className="flex flex-col gap-[1.25em] text-[0.875em] text-text-secondary leading-[1.7]">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="flex flex-col gap-[0.375em]">
                        <p className="text-[0.8125em] text-text-muted uppercase tracking-[0.06em] font-semibold">Entry {i + 1}</p>
                        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
                      </div>
                    ))}
                  </div>
                ),
              },
            ]}
          />

          {/* Application review — with footer actions */}
          <DetailOverlay
            open={overlayActionsOpen}
            onClose={() => setOverlayActionsOpen(false)}
            title="Sara Boudiaf"
            subtitle="Applied to Digi-Compta · 3 days ago"
            avatar={
              <div className="w-[2.5em] h-[2.5em] rounded-full bg-bg-alt flex items-center justify-center text-text-muted font-semibold text-[0.875em]">SB</div>
            }
            footer={
              <>
                <AppButton variant="secondary" size="sm" onClick={() => { toast.error("Application rejected"); setOverlayActionsOpen(false); }}>Reject</AppButton>
                <AppButton variant="primary"   size="sm" onClick={() => { toast.success("Application approved"); setOverlayActionsOpen(false); }}>Approve</AppButton>
              </>
            }
            sections={[
              {
                key: "profile", label: "Profile", icon: <FiUser size="0.875em" />,
                content: (
                  <div className="flex flex-col gap-[1.25em] text-[0.875em]">
                    <div className="grid grid-cols-2 gap-x-[2em] gap-y-[1em]">
                      {[["Name","Sara Boudiaf"],["Experience","5 years"],["Speciality","B2B SaaS Sales"],["LinkedIn","linkedin.com/in/sara-b"]].map(([k,v]) => (
                        <div key={k}>
                          <p className="text-[0.8125em] text-text-muted mb-[0.25em]">{k}</p>
                          <p className="text-text font-medium">{v}</p>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-[0.8125em] text-text-muted mb-[0.375em]">Bio</p>
                      <p className="text-text-secondary leading-[1.7]">Specializes in selling accounting and ERP solutions to SMBs in Algiers. Network of 50+ prospects actively seeking cloud alternatives.</p>
                    </div>
                  </div>
                ),
              },
              {
                key: "pitch", label: "Pitch", icon: <FiFileText size="0.875em" />,
                content: (
                  <div className="flex flex-col gap-[1em] text-[0.875em]">
                    <div className="bg-bg rounded-[0.5em] p-[1em] border border-border-light">
                      <p className="text-text-secondary leading-[1.7]">
                        I specialize in selling accounting and ERP solutions to SMBs in Algiers. I have a network of 50+ potential clients actively looking for cloud-based alternatives to spreadsheets. Confident I can close 2–3 deals in the first month. I've previously sold a competing product and know the objections well.
                      </p>
                    </div>
                    <div className="flex gap-[0.5em] flex-wrap">
                      {["B2B Sales","SaaS Sales","Accounting","ERP"].map((tag) => (
                        <span key={tag} className="inline-flex items-center h-[1.75em] px-[0.75em] rounded-full text-[0.75em] font-medium bg-accent-light text-accent-text border border-accent-border">{tag}</span>
                      ))}
                    </div>
                  </div>
                ),
              },
              {
                key: "settings", label: "Campaign Match", icon: <FiSettings size="0.875em" />,
                content: (
                  <div className="flex flex-col gap-[1em] text-[0.875em]">
                    {[
                      { label: "Category match", ok: true, note: "Accounting & Finance" },
                      { label: "Experience requirement", ok: true, note: "5 years — meets minimum" },
                      { label: "Previous applications", ok: true, note: "None — first application" },
                      { label: "Partner Links", ok: false, note: "Not enabled on this campaign" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-start justify-between gap-[1em]">
                        <span className="text-text-secondary">{item.label}</span>
                        <div className="flex items-center gap-[0.375em] shrink-0">
                          <StatusBadge status={item.ok ? "approved" : "pending"} />
                          <span className="text-text-muted text-[0.8125em]">{item.note}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                key: "long1", label: "Sales History", icon: <FiActivity size="0.875em" />,
                content: (
                  <div className="flex flex-col gap-[1.25em] text-[0.875em] text-text-secondary leading-[1.7]">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="flex flex-col gap-[0.375em]">
                        <p className="text-[0.8125em] text-text-muted uppercase tracking-[0.06em] font-semibold">Deal {i + 1}</p>
                        <p>Closed a DZD {((i + 1) * 45000).toLocaleString()} deal with a mid-size logistics company in Algiers. The client was using spreadsheets and needed a cloud-based ERP solution. Negotiation took 3 weeks including a demo session and two follow-ups before signing.</p>
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                key: "long2", label: "References", icon: <FiUsers size="0.875em" />,
                content: (
                  <div className="flex flex-col gap-[1.25em] text-[0.875em] text-text-secondary leading-[1.7]">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="flex flex-col gap-[0.375em]">
                        <p className="font-semibold text-text">Reference {i + 1} — {["Karim Messaoud","Lina Hamidi","Omar Tiziri","Nadia Saifi","Yacine Amrani","Ahmed Bouab","Farid Kaci","Sonia Larbi"][i]}</p>
                        <p>Former client at a mid-size accounting firm. Can attest to professionalism, follow-through, and deep product knowledge. Available for a call Monday through Thursday between 10am and 4pm.</p>
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                key: "long3", label: "Notes & Flags", icon: <FiMessageSquare size="0.875em" />,
                content: (
                  <div className="flex flex-col gap-[1.25em] text-[0.875em] text-text-secondary leading-[1.7]">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="flex flex-col gap-[0.375em]">
                        <p className="text-[0.8125em] text-text-muted uppercase tracking-[0.06em] font-semibold">Admin Note {i + 1} — Apr {i + 1}, 2026</p>
                        <p>Internal review flagged a potential duplicate application. Cross-referenced with previous campaign history and confirmed this is a unique submission. No issues found. Application cleared for review by the company.</p>
                      </div>
                    ))}
                  </div>
                ),
              },
            ]}
          />
        </Section>

        {/* 11. Toast */}
        <Section title="Toast (useToast)">
          <Row wrap>
            <AppButton variant="secondary" size="sm" onClick={() => toast.success("Lead submitted successfully")}>Success</AppButton>
            <AppButton variant="secondary" size="sm" onClick={() => toast.error("Failed to submit. Please retry.", { title: "Error" })}>Error</AppButton>
            <AppButton variant="secondary" size="sm" onClick={() => toast.warning("Escrow balance is low.")}>Warning</AppButton>
            <AppButton variant="secondary" size="sm" onClick={() => toast.info("Your application was sent for review.")}>Info</AppButton>
            <AppButton variant="secondary" size="sm" onClick={() => toast.success("Commission of DZD 12,500 confirmed.", { title: "Sale Confirmed", financial: true })}>
              Financial (no auto-dismiss)
            </AppButton>
          </Row>
        </Section>

      </div>
    </div>
  );
}
