import { supabase, DB_TABLES } from './supabase.js';

let categories = [];
let documentsData = [];
let settingsData = {};
let uiData = {};
let auditLogs = [];
let institutionalRecords = [];
let adminLogged = false;
let adminUserEmail = "";
let currentTab = "dashboard";
let currentPage = 1;
let pageSize = 6;
let toastTimer;
let currentDetailId = null;
let currentInstitutionRecordId = null;
let protocolCounter = 1;
let settingsRealtimeChannel = null;

const els = {};

document.addEventListener("DOMContentLoaded", async () => {
  mapElements();
  await syncAuthSession();
  bindAuthListener();
  await loadData();
  attachEvents();
  renderAll();
  subscribeSettingsRealtime();
});

function mapElements() {
  [
    "orgNameTop", "portalLabelTop", "portalTitleHero", "portalSubtitleHero",
    "portalTitleFooter", "footerOrgText", "sidebarPortalName", "sidebarOrgName",
    "themeToggleBtn", "goDocsBtn", "goReportsBtn", "openAdminBtn",
    "executiveBanner", "executiveBannerText", "mastheadOrgName", "mastheadPortalName",

    "statsGrid", "featuredGrid", "featuredSection",
    "favoritesSection", "favoritesGrid", "recentSection", "recentGrid",
    "categoryOverviewGrid", "publicSphereBars", "publicTypeBars",
    "publicStudentsDonutChart", "publicStudentsTotal", "publicStudentsLegend", "publicStudentsLegendSummary",
    "publicStaffDonutChart", "publicStaffTotal", "publicStaffLegend", "publicStaffLegendSummary",

    "searchInput", "typeFilter", "categoryFilter", "sphereFilter", "yearFilter", "sortFilter",
    "pageSizeSelect", "resultsInfo", "documentsGrid", "emptyState",
    "paginationWrap", "paginationInfo", "prevPageBtn", "nextPageBtn", "resetFiltersBtn",

    "detailsModal", "detailsTitle", "detailsHero", "detailsTags", "detailsMeta",
    "detailsSummary", "detailsDescription", "openPdfLink", "pdfFrame",
    "previewPlaceholder", "printDocumentBtn", "favoriteDetailBtn",

    "adminModal", "adminLoginForm", "adminUser", "adminPass",
    "adminLoginView", "adminApp", "adminNav", "adminSidebarActions", "logoutBtn",
    "adminStatsGrid", "sphereBars", "recentDocumentsBody", "activityList",
    "resetDemoBtn", "backupResetBtn",

    "institutionalStatsGrid", "institutionSearchInput", "institutionTypeFilter", "institutionStatusFilter",
    "institutionRecordsBody",
    "staffInstitutionForm", "staffInstitutionRecordId", "staffInstitutionName", "staffInstitutionPersonType",
    "staffInstitutionRole", "staffInstitutionDepartment", "staffInstitutionPosition", "staffInstitutionStatus", "staffInstitutionCpf",
    "staffInstitutionVacation", "staffInstitutionLicense", "staffInstitutionLeaveStatus", "staffInstitutionLeaveFile",
    "staffInstitutionLeaveDocumentData", "staffInstitutionLeaveDocumentName", "staffInstitutionLeaveDocumentPreview",
    "staffInstitutionAddress", "staffInstitutionPhone", "staffInstitutionEmail", "clearStaffInstitutionFormBtn", "staffInstitutionFormTitle",
    "studentInstitutionForm", "studentInstitutionRecordId", "studentInstitutionName", "studentInstitutionRole",
    "studentInstitutionDepartment", "studentInstitutionPosition", "studentInstitutionStatus", "studentInstitutionCpf",
    "studentInstitutionAddress", "studentInstitutionPhone", "studentInstitutionEmail", "clearStudentInstitutionFormBtn", "studentInstitutionFormTitle",
    "institutionDetailEmpty", "institutionDetailCard", "printInstitutionRecordBtn",
    "detailInstitutionName", "detailInstitutionType", "detailInstitutionRole", "detailInstitutionDepartment", "detailInstitutionPosition", "detailInstitutionStatus", "detailInstitutionCpf",
    "detailInstitutionVacation", "detailInstitutionLicense", "detailInstitutionLeaveStatus", "detailInstitutionLeaveDocumentWrap",
    "detailInstitutionAddress", "detailInstitutionPhone", "detailInstitutionEmail",

    "adminSearchInput", "adminStatusFilter", "adminSphereFilter", "adminDocumentsBody",

    "documentForm", "docId", "protocol", "protocolView", "formTitle",
    "title", "lawOrDocumentNumber", "documentType", "categoryId", "administrativeSphere",
    "year", "issuingBody", "publicationDate", "jurisdictionState", "jurisdictionCity",
    "summary", "fullDescription", "keywords", "pdfUrl", "active", "featured",
    "coverImageFile", "coverImageData", "coverPreview", "clearFormBtn",

    "categoryForm", "categoryEditId", "categoryName", "categoryActive",
    "categoriesBody", "clearCategoryFormBtn",

    "reportSphereFilter", "reportCategoryFilter", "reportYearFilter", "reportStatusFilter",
    "reportSummaryGrid", "reportTableBody", "exportCsvBtn", "printReportBtn",

    "auditTableBody",

    "exportJsonBtn", "importJsonInput",

    "settingsForm", "portalTitleInput", "orgNameInput", "portalSubtitleInput", "footerTextInput",
    "bannerEnabledInput", "bannerTextInput", "bannerToneInput",

    "toast"
  ].forEach(id => {
    els[id] = document.getElementById(id);
  });
}

function attachEvents() {
  els.themeToggleBtn.addEventListener("click", toggleTheme);
  els.openAdminBtn.addEventListener("click", () => openModal("adminModal"));

  els.goDocsBtn.addEventListener("click", () => {
    document.getElementById("documentsSection").scrollIntoView({ behavior: "smooth" });
  });

  els.goReportsBtn.addEventListener("click", () => {
    document.getElementById("publicIndicatorsSection").scrollIntoView({ behavior: "smooth" });
  });

  els.searchInput.addEventListener("input", handlePublicFiltersChange);
  els.typeFilter.addEventListener("change", handlePublicFiltersChange);
  els.categoryFilter.addEventListener("change", handlePublicFiltersChange);
  els.sphereFilter.addEventListener("change", handlePublicFiltersChange);
  els.yearFilter.addEventListener("change", handlePublicFiltersChange);
  els.sortFilter.addEventListener("change", handlePublicFiltersChange);

  els.pageSizeSelect.addEventListener("change", () => {
    pageSize = Number(els.pageSizeSelect.value || 6);
    currentPage = 1;
    renderPublicDocuments();
  });

  els.resetFiltersBtn.addEventListener("click", resetFilters);

  els.prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderPublicDocuments();
    }
  });

  els.nextPageBtn.addEventListener("click", () => {
    const totalPages = getTotalPublicPages();
    if (currentPage < totalPages) {
      currentPage++;
      renderPublicDocuments();
    }
  });

  els.documentsGrid.addEventListener("click", handlePublicGridClicks);
  els.featuredGrid.addEventListener("click", handleFeaturedClicks);
  els.favoritesGrid.addEventListener("click", handleFavoritesClicks);
  els.recentGrid.addEventListener("click", handleRecentClicks);
  els.categoryOverviewGrid.addEventListener("click", handleCategoryOverviewClicks);

  els.printDocumentBtn.addEventListener("click", printCurrentDocument);
  els.favoriteDetailBtn.addEventListener("click", toggleFavoriteFromDetails);

  els.adminLoginForm.addEventListener("submit", handleAdminLogin);
  els.logoutBtn.addEventListener("click", logoutAdmin);
  els.resetDemoBtn.addEventListener("click", restoreDemoData);
  els.backupResetBtn.addEventListener("click", restoreDemoData);

  document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", e => {
      closeModal(e.currentTarget.getAttribute("data-close"));
    });
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      closeModal("detailsModal");
      closeModal("adminModal");
    }
  });

  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => switchAdminTab(btn.dataset.tab));
  });

  els.adminSearchInput.addEventListener("input", renderAdminDocumentsTable);
  els.adminStatusFilter.addEventListener("change", renderAdminDocumentsTable);
  els.adminSphereFilter.addEventListener("change", renderAdminDocumentsTable);

  els.institutionSearchInput.addEventListener("input", renderInstitutionalTable);
  els.institutionTypeFilter.addEventListener("change", renderInstitutionalTable);
  els.institutionStatusFilter.addEventListener("change", renderInstitutionalTable);

  els.adminDocumentsBody.addEventListener("click", handleAdminDocumentsClicks);
  els.institutionRecordsBody.addEventListener("click", handleInstitutionalTableClicks);

  els.documentForm.addEventListener("submit", handleSaveDocument);
  els.staffInstitutionForm.addEventListener("submit", event => handleSaveInstitutionalRecord(event, "staff"));
  els.studentInstitutionForm.addEventListener("submit", event => handleSaveInstitutionalRecord(event, "student"));
  els.printInstitutionRecordBtn.addEventListener("click", () => printInstitutionalRecord());
  els.staffInstitutionLeaveFile.addEventListener("change", event => handleInstitutionLeaveFileChange(event, "staff"));
  els.clearFormBtn.addEventListener("click", clearDocumentForm);
  els.clearStaffInstitutionFormBtn.addEventListener("click", () => clearInstitutionalForm("staff"));
  els.clearStudentInstitutionFormBtn.addEventListener("click", () => clearInstitutionalForm("student"));
  els.coverImageFile.addEventListener("change", handleCoverUpload);

  els.categoryForm.addEventListener("submit", handleSaveCategory);
  els.clearCategoryFormBtn.addEventListener("click", clearCategoryForm);
  els.categoriesBody.addEventListener("click", handleCategoriesClicks);

  els.reportSphereFilter.addEventListener("change", renderReportsCenter);
  els.reportCategoryFilter.addEventListener("change", renderReportsCenter);
  els.reportYearFilter.addEventListener("change", renderReportsCenter);
  els.reportStatusFilter.addEventListener("change", renderReportsCenter);
  els.exportCsvBtn.addEventListener("click", exportCsvReport);
  els.printReportBtn.addEventListener("click", printReportA4);

  els.exportJsonBtn.addEventListener("click", exportJsonBackup);
  els.importJsonInput.addEventListener("change", importJsonBackup);

  if (els.settingsForm) {
  els.settingsForm.addEventListener("submit", handleSaveSettings);
}
}


const SETTINGS_ROW_ID = "main";
const UI_ROW_ID = "shared";

function createDefaultUiState() {
  return {
    theme: "light",
    favorites: [],
    recentViews: []
  };
}

async function loadData() {
  settingsData = createDefaultSettings();
  uiData = createDefaultUiState();
  categories = [];
  documentsData = [];
  auditLogs = [];
  institutionalRecords = [];

  try {
    const [
      settingsResponse,
      uiResponse,
      categoriesResponse,
      documentsResponse,
      auditResponse,
      institutionalResponse
    ] = await Promise.all([
      supabase.from(DB_TABLES.settings).select("id, data").eq("id", SETTINGS_ROW_ID).maybeSingle(),
      adminLogged
        ? supabase.from(DB_TABLES.ui).select("id, data").eq("id", UI_ROW_ID).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase.from(DB_TABLES.categories).select("*").order("name", { ascending: true }),
      supabase.from(DB_TABLES.documents).select("*").order("updated_at", { ascending: false }),
      adminLogged
        ? supabase.from(DB_TABLES.audit).select("*").order("time", { ascending: false }).limit(300)
        : Promise.resolve({ data: [], error: null }),
      adminLogged
        ? supabase.from(DB_TABLES.institutional).select("*").order("updated_at", { ascending: false })
        : Promise.resolve({ data: [], error: null })
    ]);

    if (settingsResponse.error) throw settingsResponse.error;
    if (categoriesResponse.error) throw categoriesResponse.error;
    if (documentsResponse.error) throw documentsResponse.error;
    if (auditResponse.error) throw auditResponse.error;
    if (institutionalResponse.error) throw institutionalResponse.error;

    settingsData = {
      ...createDefaultSettings(),
      ...(settingsResponse.data?.data || {})
    };
    uiData = uiResponse?.data?.data || createDefaultUiState();
    categories = (categoriesResponse.data || []).map(fromDbCategory);
    documentsData = (documentsResponse.data || []).map(fromDbDocument);
    auditLogs = (auditResponse.data || []).map(fromDbAuditLog);
    institutionalRecords = (institutionalResponse.data || []).map(fromDbInstitutionalRecord);

    if (adminLogged) {
      syncPublicInstitutionalSummary();
    }

    protocolCounter = documentsData.length + 1;

    if (!settingsResponse.data && adminLogged) {
      await upsertSingleton(DB_TABLES.settings, SETTINGS_ROW_ID, createDefaultSettings());
    }
  } catch (error) {
    console.error("Erro ao carregar os dados do Supabase:", error);
    settingsData = createDefaultSettings();
    uiData = createDefaultUiState();
    categories = [];
    documentsData = [];
    auditLogs = [];
    institutionalRecords = [];
    protocolCounter = 1;
  }
}

async function saveData() {
  if (!adminLogged) return;

  syncPublicInstitutionalSummary();

  try {
    await Promise.all([
      upsertSingleton(DB_TABLES.settings, SETTINGS_ROW_ID, settingsData),
      upsertSingleton(DB_TABLES.ui, UI_ROW_ID, uiData),
      syncCollectionTable(DB_TABLES.categories, categories.map(toDbCategory)),
      syncCollectionTable(DB_TABLES.documents, documentsData.map(toDbDocument)),
      syncCollectionTable(DB_TABLES.audit, auditLogs.map(toDbAuditLog)),
      syncCollectionTable(DB_TABLES.institutional, institutionalRecords.map(toDbInstitutionalRecord))
    ]);
  } catch (error) {
    console.error("Erro ao salvar os dados no Supabase:", error);
    showToast("Não foi possível salvar no Supabase.");
  }
}

async function upsertSingleton(table, id, data) {
  const { error } = await supabase
    .from(table)
    .upsert({ id, data, updated_at: new Date().toISOString() }, { onConflict: "id" });

  if (error) throw error;
}

async function syncCollectionTable(table, rows) {
  const payload = rows.map(row => ({ ...row }));

  const { data: existingRows, error: existingError } = await supabase.from(table).select("id");
  if (existingError) throw existingError;

  const existingIds = new Set((existingRows || []).map(row => row.id));
  const nextIds = new Set(payload.map(row => row.id));

  if (payload.length) {
    const { error: upsertError } = await supabase.from(table).upsert(payload, { onConflict: "id" });
    if (upsertError) throw upsertError;
  }

  const idsToDelete = [...existingIds].filter(id => !nextIds.has(id));
  if (idsToDelete.length) {
    const { error: deleteError } = await supabase.from(table).delete().in("id", idsToDelete);
    if (deleteError) throw deleteError;
  }
}

function fromDbCategory(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    active: !!row.active,
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || ""
  };
}

function toDbCategory(category) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    active: !!category.active,
    created_at: category.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function fromDbDocument(row) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    protocol: row.protocol,
    documentType: row.document_type,
    categoryId: row.category_id,
    categoryName: row.category_name,
    administrativeSphere: row.administrative_sphere,
    lawOrDocumentNumber: row.law_or_document_number || "",
    year: Number(row.year),
    issuingBody: row.issuing_body,
    jurisdictionState: row.jurisdiction_state || "",
    jurisdictionCity: row.jurisdiction_city || "",
    publicationDate: row.publication_date || "",
    summary: row.summary,
    fullDescription: row.full_description,
    keywords: Array.isArray(row.keywords) ? row.keywords : [],
    pdfUrl: row.pdf_url || "",
    coverImageData: row.cover_image_data || "",
    active: !!row.active,
    featured: !!row.featured,
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || ""
  };
}

function toDbDocument(doc) {
  return {
    id: doc.id,
    title: doc.title,
    slug: doc.slug,
    protocol: doc.protocol,
    document_type: doc.documentType,
    category_id: doc.categoryId,
    category_name: doc.categoryName,
    administrative_sphere: doc.administrativeSphere,
    law_or_document_number: doc.lawOrDocumentNumber || "",
    year: Number(doc.year),
    issuing_body: doc.issuingBody,
    jurisdiction_state: doc.jurisdictionState || "",
    jurisdiction_city: doc.jurisdictionCity || "",
    publication_date: doc.publicationDate || null,
    summary: doc.summary,
    full_description: doc.fullDescription,
    keywords: Array.isArray(doc.keywords) ? doc.keywords : [],
    pdf_url: doc.pdfUrl || "",
    cover_image_data: doc.coverImageData || "",
    active: !!doc.active,
    featured: !!doc.featured,
    created_at: doc.createdAt || new Date().toISOString(),
    updated_at: doc.updatedAt || new Date().toISOString()
  };
}

function fromDbAuditLog(row) {
  return {
    id: row.id,
    time: row.time,
    action: row.action,
    targetType: row.target_type,
    targetLabel: row.target_label,
    detail: row.detail || ""
  };
}

function toDbAuditLog(log) {
  return {
    id: log.id,
    time: log.time,
    action: log.action,
    target_type: log.targetType,
    target_label: log.targetLabel,
    detail: log.detail || "",
    created_at: log.time || new Date().toISOString()
  };
}

function normalizeInstitutionalRecord(record = {}) {
  return {
    id: record.id || "",
    name: record.name || "",
    personType: record.personType || record.person_type || "",
    role: record.role || "",
    department: record.department || record.department_name || "",
    position: record.position || "",
    status: record.status || record.employment_status || "Ativo",
    vacation: record.vacation || record.vacation_type || "",
    license: record.license || record.license_type || "",
    leaveStatus: record.leaveStatus || record.leave_status || "",
    leaveDocumentData: record.leaveDocumentData || record.leave_document_data || "",
    leaveDocumentName: record.leaveDocumentName || record.leave_document_name || "",
    cpf: record.cpf || "",
    address: record.address || "",
    phone: record.phone || "",
    email: record.email || "",
    createdAt: record.createdAt || record.created_at || "",
    updatedAt: record.updatedAt || record.updated_at || ""
  };
}

function fromDbInstitutionalRecord(row) {
  return normalizeInstitutionalRecord(row);
}

function toDbInstitutionalRecord(record) {
  const normalized = normalizeInstitutionalRecord(record);

  return {
    id: normalized.id,
    name: normalized.name,
    person_type: normalized.personType,
    role: normalized.role,
    department: normalized.department,
    position: normalized.position,
    employment_status: normalized.status,
    vacation_type: normalized.vacation,
    license_type: normalized.license,
    leave_status: normalized.leaveStatus,
    leave_document_data: normalized.leaveDocumentData,
    leave_document_name: normalized.leaveDocumentName,
    cpf: normalized.cpf,
    address: normalized.address,
    phone: normalized.phone,
    email: normalized.email,
    created_at: normalized.createdAt || new Date().toISOString(),
    updated_at: normalized.updatedAt || new Date().toISOString()
  };
}

function resetToSeedData() {
  settingsData = createDefaultSettings();
  uiData = createDefaultUiState();
  auditLogs = [];
  categories = createSeedCategories();
  protocolCounter = 1;
  documentsData = createSeedDocuments(categories);
  institutionalRecords = createSeedInstitutionalRecords();
  addAudit("Inicialização", "Sistema", "Base de exemplo", "Base padrão carregada");
}


function renderAll() {
  applyTheme(uiData.theme || "light", false);
  applySettingsToUI();
  fillSettingsForm();
  renderExecutiveBanner();
  renderPublicFilterOptions();
  populateReportFilters();
  renderPublicStats();
  renderPublicIndicators();
  renderPublicStudentsDonut();
  renderPublicStaffDonut();
  renderFeaturedDocuments();
  renderFavoritesSection();
  renderRecentSection();
  renderCategoryOverview();
  renderPublicDocuments();
  renderAdminState();
  renderAdminStats();
  renderSphereBars();
  renderRecentDocuments();
  renderActivityList();
  renderAdminDocumentsTable();
  renderCategoriesTable();
  populateCategorySelects();
  renderInstitutionalStats();
  renderInstitutionalTable();
  renderInstitutionalDetail(currentInstitutionRecordId);
  renderReportsCenter();
  renderAuditTable();
}

function renderExecutiveBanner() {
  const enabled = !!settingsData.bannerEnabled;
  els.executiveBanner.classList.toggle("hidden", !enabled);
  els.executiveBanner.classList.remove("info", "success", "warning");
  els.executiveBanner.classList.add(settingsData.bannerTone || "info");
  els.executiveBannerText.textContent = settingsData.bannerText || "";
}

function applyTheme(theme, persist = true) {
  const finalTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", finalTheme);
  uiData.theme = finalTheme;
  els.themeToggleBtn.textContent = finalTheme === "dark" ? "Modo claro" : "Modo escuro";
  if (persist) saveData();
}

function toggleTheme() {
  const nextTheme = (uiData.theme || "light") === "light" ? "dark" : "light";
  applyTheme(nextTheme);
}

function setText(el, value) {
  if (el) el.textContent = value ?? "";
}

function setValue(el, value) {
  if (el) el.value = value ?? "";
}

function applySettingsToUI() {
  setText(els.orgNameTop, settingsData.orgName);
  setText(els.portalLabelTop, settingsData.footerLabel);
  setText(els.portalTitleHero, settingsData.portalTitle);
  setText(els.portalSubtitleHero, settingsData.portalSubtitle);
  setText(els.portalTitleFooter, settingsData.portalTitle);
  setText(els.footerOrgText, settingsData.footerText);
  setText(els.sidebarPortalName, settingsData.portalTitle);
  setText(els.sidebarOrgName, settingsData.orgName);
  setText(els.mastheadOrgName, settingsData.orgName);
  setText(els.mastheadPortalName, settingsData.portalTitle);
}

function fillSettingsForm() {
  if (!els.portalTitleInput) return;
  setValue(els.portalTitleInput, settingsData.portalTitle || "");
  setValue(els.orgNameInput, settingsData.orgName || "");
  setValue(els.portalSubtitleInput, settingsData.portalSubtitle || "");
  setValue(els.footerTextInput, settingsData.footerText || "");
  els.bannerEnabledInput.checked = !!settingsData.bannerEnabled;
  setValue(els.bannerTextInput, settingsData.bannerText || "");
  if (els.bannerToneInput) els.bannerToneInput.value = settingsData.bannerTone || "info";
}

async function handleSaveSettings(event) {
  event.preventDefault();

  settingsData.portalTitle = els.portalTitleInput.value.trim() || settingsData.portalTitle;
  settingsData.orgName = els.orgNameInput.value.trim() || settingsData.orgName;
  settingsData.portalSubtitle = els.portalSubtitleInput.value.trim() || settingsData.portalSubtitle;
  settingsData.footerText = els.footerTextInput.value.trim() || settingsData.footerText;
  settingsData.footerLabel = "Portal de Normas e Legislação Educacional";
  settingsData.bannerEnabled = els.bannerEnabledInput.checked;
  settingsData.bannerText = els.bannerTextInput.value.trim();
  settingsData.bannerTone = els.bannerToneInput.value || "info";

  await saveData();
  applySettingsToUI();
  renderExecutiveBanner();
  addAudit("Atualização", "Configuração", "Portal", "Configurações institucionais atualizadas");
  renderAuditTable();
  showToast("Configurações salvas.");
}

function handlePublicFiltersChange() {
  currentPage = 1;
  renderPublicDocuments();
}

function renderPublicFilterOptions() {
  fillSelect(els.typeFilter, uniqueValues(documentsData.map(item => item.documentType)).sort());
  fillSelect(
    els.categoryFilter,
    categories.filter(c => c.active).map(c => c.name).sort((a, b) => a.localeCompare(b, "pt-BR"))
  );
  fillSelect(
    els.yearFilter,
    uniqueValues(documentsData.map(item => String(item.year))).sort((a, b) => Number(b) - Number(a))
  );
}

function populateReportFilters() {
  fillSelect(
    els.reportCategoryFilter,
    categories.map(c => c.name).sort((a, b) => a.localeCompare(b, "pt-BR"))
  );
  fillSelect(
    els.reportYearFilter,
    uniqueValues(documentsData.map(item => String(item.year))).sort((a, b) => Number(b) - Number(a))
  );
}

function fillSelect(select, values) {
  const currentValue = select.value;
  const firstOption = select.querySelector("option")?.outerHTML || `<option value="">Todos</option>`;
  select.innerHTML = firstOption + values.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
  if ([...select.options].some(option => option.value === currentValue)) {
    select.value = currentValue;
  }
}

function renderPublicStats() {
  const total = documentsData.length;
  const active = documentsData.filter(doc => doc.active).length;
  const featured = documentsData.filter(doc => doc.active && doc.featured).length;
  const categoriesCount = categories.filter(c => c.active).length;
  const institutionalSummary = getPublicInstitutionalSummary();

  els.statsGrid.innerHTML = `
    ${statCard("Total de documentos", total)}
    ${statCard("Documentos públicos", active)}
    ${statCard("Categorias ativas", categoriesCount)}
    ${statCard("Em destaque", featured)}
    ${statCard("Funcionários cadastrados", institutionalSummary.staff)}
    ${statCard("Alunos cadastrados", institutionalSummary.students)}
  `;
}

function renderPublicIndicators() {
  const publicDocs = documentsData.filter(doc => doc.active);

  const sphereCounts = {
    Federal: publicDocs.filter(d => d.administrativeSphere === "Federal").length,
    Estadual: publicDocs.filter(d => d.administrativeSphere === "Estadual").length,
    Municipal: publicDocs.filter(d => d.administrativeSphere === "Municipal").length
  };

  const maxSphere = Math.max(1, ...Object.values(sphereCounts));

  els.publicSphereBars.innerHTML = Object.entries(sphereCounts).map(([label, value]) => `
    <div class="bar-item">
      <div class="bar-head">
        <span>${escapeHtml(label)}</span>
        <span>${escapeHtml(String(value))}</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${(value / maxSphere) * 100}%"></div>
      </div>
    </div>
  `).join("");

  const typeGroups = groupCounts(publicDocs, "documentType").slice(0, 5);
  const maxType = Math.max(1, ...typeGroups.map(item => item.count));

  els.publicTypeBars.innerHTML = typeGroups.map(item => `
    <div class="bar-item">
      <div class="bar-head">
        <span>${escapeHtml(item.label)}</span>
        <span>${escapeHtml(String(item.count))}</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${(item.count / maxType) * 100}%"></div>
      </div>
    </div>
  `).join("");
}

function renderPublicStudentsDonut() {
  if (!els.publicStudentsDonutChart || !els.publicStudentsLegend || !els.publicStudentsTotal) return;

  const groups = getPublicStudentsBySchool();
  const total = groups.reduce((sum, item) => sum + item.count, 0);
  const palette = [
    "#facc15", // Amarelo
    "#ef4444", // Vermelho
    "#3b82f6", // Azul
    "#22c55e", // Verde
    "#a855f7", // Roxo
    "#9ca3af", // Cinza
    "#ec4899"  // Rosa
  ];

  els.publicStudentsTotal.textContent = String(total);

  if (els.publicStudentsLegendSummary) {
    els.publicStudentsLegendSummary.textContent = total
      ? `${groups.length} ${groups.length === 1 ? "escola" : "escolas"} com alunos cadastrados`
      : "Nenhum aluno cadastrado.";
  }

  if (!groups.length || total <= 0) {
    els.publicStudentsDonutChart.classList.add("is-empty");
    els.publicStudentsDonutChart.style.background = "conic-gradient(var(--border) 0deg 360deg)";
    els.publicStudentsLegend.innerHTML = `<div class="student-donut-empty">Nenhum aluno cadastrado nas escolas até o momento.</div>`;
    return;
  }

  let currentDeg = 0;
  const gradientParts = groups.map((item, index) => {
    const sliceDeg = (item.count / total) * 360;
    const start = currentDeg;
    const end = currentDeg + sliceDeg;
    currentDeg = end;
    return `${palette[index % palette.length]} ${start}deg ${end}deg`;
  });

  els.publicStudentsDonutChart.classList.remove("is-empty");
  els.publicStudentsDonutChart.style.background = `conic-gradient(${gradientParts.join(", ")})`;

  els.publicStudentsLegend.innerHTML = groups.map((item, index) => {
    const percentage = total ? ((item.count / total) * 100).toFixed(1).replace(".", ",") : "0,0";
    const color = palette[index % palette.length];

    return `
      <div class="student-donut-legend-item">
        <span class="student-donut-legend-color" style="background:${color}"></span>
        <div class="student-donut-legend-text">
          <strong>${escapeHtml(item.label)}</strong>
          <span>${escapeHtml(String(item.count))} aluno(s) • ${escapeHtml(percentage)}%</span>
        </div>
      </div>
    `;
  }).join("");
}


function generateRandomChartPalette(totalItems) {
  return Array.from({ length: Math.max(0, totalItems) }, (_, index) => {
    const hue = Math.round((360 / Math.max(totalItems, 1)) * index + Math.random() * 28) % 360;
    const saturation = 65 + Math.round(Math.random() * 20);
    const lightness = 45 + Math.round(Math.random() * 12);
    return `hsl(${hue}deg ${saturation}% ${lightness}%)`;
  });
}

function renderPublicStaffDonut() {
  if (!els.publicStaffDonutChart || !els.publicStaffLegend || !els.publicStaffTotal) return;

  const groups = getPublicStaffBySchool();
  const total = groups.reduce((sum, item) => sum + item.count, 0);
  const palette = generateRandomChartPalette(groups.length || 1);

  els.publicStaffTotal.textContent = String(total);

  if (els.publicStaffLegendSummary) {
    els.publicStaffLegendSummary.textContent = total
      ? `${groups.length} ${groups.length === 1 ? "escola" : "escolas"} com funcionários / professores cadastrados`
      : "Nenhum cadastro de funcionário ou professor.";
  }

  if (!groups.length || total <= 0) {
    els.publicStaffDonutChart.classList.add("is-empty");
    els.publicStaffDonutChart.style.background = "conic-gradient(var(--border) 0deg 360deg)";
    els.publicStaffLegend.innerHTML = `<div class="student-donut-empty">Nenhum funcionário ou professor cadastrado nas escolas até o momento.</div>`;
    return;
  }

  let currentDeg = 0;
  const gradientParts = groups.map((item, index) => {
    const sliceDeg = (item.count / total) * 360;
    const start = currentDeg;
    const end = currentDeg + sliceDeg;
    currentDeg = end;
    return `${palette[index % palette.length]} ${start}deg ${end}deg`;
  });

  els.publicStaffDonutChart.classList.remove("is-empty");
  els.publicStaffDonutChart.style.background = `conic-gradient(${gradientParts.join(", ")})`;

  els.publicStaffLegend.innerHTML = groups.map((item, index) => {
    const percentage = total ? ((item.count / total) * 100).toFixed(1).replace(".", ",") : "0,0";
    const color = palette[index % palette.length];

    return `
      <div class="student-donut-legend-item">
        <span class="student-donut-legend-color" style="background:${color}"></span>
        <div class="student-donut-legend-text">
          <strong>${escapeHtml(item.label)}</strong>
          <span>${escapeHtml(String(item.count))} registro(s) • ${escapeHtml(percentage)}%</span>
        </div>
      </div>
    `;
  }).join("");
}

function renderFeaturedDocuments() {
  const featuredDocs = documentsData
    .filter(doc => doc.active && doc.featured)
    .sort((a, b) => Number(b.year) - Number(a.year))
    .slice(0, 3);

  els.featuredSection.classList.toggle("hidden", featuredDocs.length === 0);
  els.featuredGrid.innerHTML = featuredDocs.map(doc => renderFeatureCard(doc)).join("");
}

function renderFavoritesSection() {
  const favorites = getFavoriteDocuments();
  els.favoritesSection.classList.toggle("hidden", favorites.length === 0);
  els.favoritesGrid.innerHTML = favorites.map(doc => renderFeatureCard(doc, true)).join("");
}

function renderRecentSection() {
  const recent = getRecentDocuments();
  els.recentSection.classList.toggle("hidden", recent.length === 0);
  els.recentGrid.innerHTML = recent.map(doc => renderFeatureCard(doc, true)).join("");
}

function renderFeatureCard(doc, compact = false) {
  return `
    <article class="featured-card">
      <div class="featured-thumb" style="${coverStyle(doc.coverImageData)}">
        <span>${escapeHtml(doc.documentType)}</span>
        <button class="favorite-fab ${isFavorite(doc.id) ? "active" : ""}" data-action="toggle-favorite" data-id="${doc.id}" title="Favoritar">
          ${isFavorite(doc.id) ? "♥" : "♡"}
        </button>
      </div>
      <div class="featured-body">
        <div class="meta-tags">
          <span class="badge">${escapeHtml(doc.categoryName)}</span>
          <span class="badge">${escapeHtml(doc.administrativeSphere)}</span>
          ${doc.featured ? `<span class="badge badge-green">Destaque</span>` : ""}
        </div>
        <h3>${escapeHtml(doc.title)}</h3>
        <p>${escapeHtml(limitText(doc.summary, compact ? 120 : 135))}</p>
        <div class="doc-actions">
          <button class="btn btn-primary" data-action="details" data-id="${doc.id}">Visualizar</button>
        </div>
      </div>
    </article>
  `;
}

function getFavoriteDocuments() {
  const favoriteIds = uiData.favorites || [];
  return favoriteIds
    .map(id => documentsData.find(doc => doc.id === id && doc.active))
    .filter(Boolean);
}

function getRecentDocuments() {
  const recentIds = uiData.recentViews || [];
  return recentIds
    .map(id => documentsData.find(doc => doc.id === id && doc.active))
    .filter(Boolean);
}

function isFavorite(id) {
  return (uiData.favorites || []).includes(id);
}

function toggleFavorite(id) {
  uiData.favorites = uiData.favorites || [];
  if (uiData.favorites.includes(id)) {
    uiData.favorites = uiData.favorites.filter(item => item !== id);
    showToast("Documento removido dos favoritos.");
  } else {
    uiData.favorites.unshift(id);
    uiData.favorites = uiData.favorites.slice(0, 20);
    showToast("Documento adicionado aos favoritos.");
  }
  saveData();
  renderFavoritesSection();
  renderFeaturedDocuments();
  renderPublicDocuments();
  updateFavoriteDetailButton();
}

function addRecentView(id) {
  uiData.recentViews = uiData.recentViews || [];
  uiData.recentViews = [id, ...uiData.recentViews.filter(item => item !== id)].slice(0, 8);
  saveData();
  renderRecentSection();
}

function updateFavoriteDetailButton() {
  if (!currentDetailId) return;
  els.favoriteDetailBtn.textContent = isFavorite(currentDetailId) ? "Remover dos favoritos" : "Favoritar";
}

function toggleFavoriteFromDetails() {
  if (!currentDetailId) return;
  toggleFavorite(currentDetailId);
}

function handleFeaturedClicks(event) {
  handleFeatureGridEvent(event);
}

function handleFavoritesClicks(event) {
  handleFeatureGridEvent(event);
}

function handleRecentClicks(event) {
  handleFeatureGridEvent(event);
}

function handleFeatureGridEvent(event) {
  const favoriteBtn = event.target.closest("[data-action='toggle-favorite']");
  if (favoriteBtn) {
    toggleFavorite(favoriteBtn.dataset.id);
    return;
  }
  const detailsBtn = event.target.closest("[data-action='details']");
  if (detailsBtn) {
    openDetails(detailsBtn.dataset.id);
  }
}

function renderCategoryOverview() {
  const cards = categories
    .filter(c => c.active)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
    .map(category => {
      const count = documentsData.filter(doc => doc.active && doc.categoryId === category.id).length;
      return `
        <article class="category-card" data-category-name="${escapeHtml(category.name)}">
          <strong>${escapeHtml(category.name)}</strong>
          <p>Área temática do acervo institucional.</p>
          <span class="category-number">${count} documento(s)</span>
        </article>
      `;
    });

  els.categoryOverviewGrid.innerHTML = cards.join("");
}

function handleCategoryOverviewClicks(event) {
  const card = event.target.closest("[data-category-name]");
  if (!card) return;
  els.categoryFilter.value = card.dataset.categoryName;
  currentPage = 1;
  renderPublicDocuments();
  document.getElementById("documentsSection").scrollIntoView({ behavior: "smooth" });
}

function getFilteredPublicDocuments() {
  const search = normalizeText(els.searchInput.value.trim());
  const type = els.typeFilter.value;
  const category = els.categoryFilter.value;
  const sphere = els.sphereFilter.value;
  const year = els.yearFilter.value;
  const sort = els.sortFilter.value;

  let result = documentsData.filter(doc => doc.active);

  if (search) {
    result = result.filter(doc => {
      const haystack = normalizeText([
        doc.title,
        doc.protocol,
        doc.lawOrDocumentNumber,
        doc.summary,
        doc.fullDescription,
        doc.issuingBody,
        doc.categoryName,
        ...(doc.keywords || [])
      ].join(" "));
      return haystack.includes(search);
    });
  }

  if (type) result = result.filter(doc => doc.documentType === type);
  if (category) result = result.filter(doc => doc.categoryName === category);
  if (sphere) result = result.filter(doc => doc.administrativeSphere === sphere);
  if (year) result = result.filter(doc => String(doc.year) === year);

  result.sort((a, b) => {
    if (sort === "oldest") return Number(a.year) - Number(b.year);
    if (sort === "az") return a.title.localeCompare(b.title, "pt-BR");
    if (sort === "za") return b.title.localeCompare(a.title, "pt-BR");
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return result;
}

function getTotalPublicPages() {
  return Math.max(1, Math.ceil(getFilteredPublicDocuments().length / pageSize));
}

function renderPublicDocuments() {
  const filtered = getFilteredPublicDocuments();
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  els.resultsInfo.textContent = `${filtered.length} documento(s) encontrado(s)`;
  els.emptyState.classList.toggle("hidden", filtered.length > 0);

  if (!filtered.length) {
    els.documentsGrid.innerHTML = "";
    els.paginationWrap.classList.add("hidden");
    return;
  }

  els.documentsGrid.innerHTML = paginated.map(doc => `
    <article class="doc-card">
      <div class="doc-thumb" style="${coverStyle(doc.coverImageData)}">
        <div class="doc-thumb-overlay">${escapeHtml(doc.documentType)} • ${escapeHtml(String(doc.year))}</div>
        <button class="favorite-fab ${isFavorite(doc.id) ? "active" : ""}" data-action="toggle-favorite" data-id="${doc.id}" title="Favoritar">
          ${isFavorite(doc.id) ? "♥" : "♡"}
        </button>
      </div>

      <div class="doc-content">
        <div class="meta-tags">
          <span class="badge">${escapeHtml(doc.categoryName)}</span>
          <span class="badge">${escapeHtml(doc.administrativeSphere)}</span>
          ${doc.featured ? `<span class="badge badge-green">Destaque</span>` : ""}
        </div>

        <h3 class="doc-title">${escapeHtml(doc.title)}</h3>

        <p class="doc-summary">${escapeHtml(limitText(doc.summary, 150))}</p>

        <div class="doc-meta">
          <span class="badge">${escapeHtml(doc.protocol || "Sem protocolo")}</span>
          <span class="badge">${escapeHtml(doc.lawOrDocumentNumber || "Sem número")}</span>
        </div>

        <div class="doc-actions">
          <button class="btn btn-primary" data-action="details" data-id="${doc.id}">Visualizar</button>
        </div>
      </div>
    </article>
  `).join("");

  els.paginationWrap.classList.toggle("hidden", totalPages <= 1);
  els.paginationInfo.textContent = `Página ${currentPage} de ${totalPages}`;
  els.prevPageBtn.disabled = currentPage <= 1;
  els.nextPageBtn.disabled = currentPage >= totalPages;
}

function handlePublicGridClicks(event) {
  const favoriteBtn = event.target.closest("[data-action='toggle-favorite']");
  if (favoriteBtn) {
    toggleFavorite(favoriteBtn.dataset.id);
    return;
  }

  const btn = event.target.closest("[data-action='details']");
  if (!btn) return;
  openDetails(btn.dataset.id);
}

function openDetails(id) {
  const doc = documentsData.find(item => item.id === id);
  if (!doc) return;

  currentDetailId = id;
  addRecentView(id);

  els.detailsTitle.textContent = doc.title;
  els.detailsHero.style.backgroundImage = doc.coverImageData ? `url("${doc.coverImageData}")` : "";

  els.detailsTags.innerHTML = `
    <span class="badge">${escapeHtml(doc.documentType)}</span>
    <span class="badge">${escapeHtml(doc.categoryName || "Sem categoria")}</span>
    <span class="badge">${escapeHtml(doc.administrativeSphere || "-")}</span>
    <span class="badge">${escapeHtml(String(doc.year || "-"))}</span>
    ${doc.featured ? `<span class="badge badge-green">Destaque</span>` : ""}
  `;

  const metaItems = [
    ["Protocolo", doc.protocol || "Não informado"],
    ["Número", doc.lawOrDocumentNumber || "Não informado"],
    ["Órgão emissor", doc.issuingBody || "Não informado"],
    ["Estado", doc.jurisdictionState || "Não informado"],
    ["Município", doc.jurisdictionCity || "Não informado"],
    ["Publicação", doc.publicationDate ? formatDate(doc.publicationDate) : "Não informado"],
    ["Palavras-chave", (doc.keywords || []).join(", ") || "Não informado"],
    ["Última atualização", formatDateTime(doc.updatedAt)]
  ];

  els.detailsMeta.innerHTML = metaItems.map(([label, value]) => `
    <div class="meta-item">
      <strong>${escapeHtml(label)}</strong>
      <span>${escapeHtml(value)}</span>
    </div>
  `).join("");

  els.detailsSummary.textContent = doc.summary || "";
  els.detailsDescription.textContent = doc.fullDescription || "";
  updateFavoriteDetailButton();

  if (doc.pdfUrl) {
    els.openPdfLink.href = doc.pdfUrl;
    els.openPdfLink.classList.remove("hidden");
    els.pdfFrame.src = doc.pdfUrl;
    els.pdfFrame.classList.remove("hidden");
    els.previewPlaceholder.classList.add("hidden");
  } else {
    els.openPdfLink.href = "#";
    els.openPdfLink.classList.add("hidden");
    els.pdfFrame.src = "";
    els.pdfFrame.classList.add("hidden");
    els.previewPlaceholder.classList.remove("hidden");
  }

  openModal("detailsModal");
}

function printCurrentDocument() {
  if (!currentDetailId) return;
  const doc = documentsData.find(item => item.id === currentDetailId);
  if (!doc) return;

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <title>Ficha Institucional do Documento</title>
      <style>
        body { font-family: Arial, Helvetica, sans-serif; margin: 32px; color: #0f172a; }
        .header { border-bottom: 3px solid #1646b3; padding-bottom: 12px; margin-bottom: 20px; }
        .header h1 { margin: 0 0 6px; font-size: 26px; }
        .header p { margin: 0; color: #475569; }
        .doc-title { margin-bottom: 14px; }
        .doc-title h2 { margin: 0 0 8px; font-size: 24px; }
        .doc-title p { margin: 0; color: #475569; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 18px 0; }
        .item { border: 1px solid #dbe4f0; border-radius: 10px; padding: 10px 12px; }
        .item strong { display: block; margin-bottom: 4px; font-size: 13px; color: #334155; }
        .block { margin-top: 18px; }
        .block h3 { margin: 0 0 8px; font-size: 18px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${escapeHtml(settingsData.portalTitle)}</h1>
        <p>${escapeHtml(settingsData.orgName)}</p>
      </div>

      <div class="doc-title">
        <h2>${escapeHtml(doc.title)}</h2>
        <p>${escapeHtml(doc.summary || "")}</p>
      </div>

      <div class="grid">
        <div class="item"><strong>Protocolo</strong>${escapeHtml(doc.protocol || "-")}</div>
        <div class="item"><strong>Tipo</strong>${escapeHtml(doc.documentType || "-")}</div>
        <div class="item"><strong>Categoria</strong>${escapeHtml(doc.categoryName || "-")}</div>
        <div class="item"><strong>Esfera</strong>${escapeHtml(doc.administrativeSphere || "-")}</div>
        <div class="item"><strong>Número</strong>${escapeHtml(doc.lawOrDocumentNumber || "-")}</div>
        <div class="item"><strong>Ano</strong>${escapeHtml(String(doc.year || "-"))}</div>
        <div class="item"><strong>Órgão emissor</strong>${escapeHtml(doc.issuingBody || "-")}</div>
        <div class="item"><strong>Publicação</strong>${escapeHtml(doc.publicationDate ? formatDate(doc.publicationDate) : "-")}</div>
      </div>

      <div class="block">
        <h3>Descrição completa</h3>
        <p>${escapeHtml(doc.fullDescription || "")}</p>
      </div>

      <div class="block">
        <h3>Palavras-chave</h3>
        <p>${escapeHtml((doc.keywords || []).join(", ") || "-")}</p>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank", "width=980,height=760");
  if (!printWindow) {
    showToast("Não foi possível abrir a janela de impressão.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 300);
}

function printInstitutionalRecord(recordId = currentInstitutionRecordId) {
  if (!recordId) {
    showToast("Selecione uma ficha institucional para imprimir.");
    return;
  }

  const rawRecord = institutionalRecords.find(item => item.id === recordId);
  const record = rawRecord ? normalizeInstitutionalRecord(rawRecord) : null;
  if (!record) {
    showToast("Ficha institucional não encontrada.");
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <title>Ficha Individual Institucional</title>
      <style>
        body { font-family: Arial, Helvetica, sans-serif; margin: 32px; color: #0f172a; }
        .header { border-bottom: 3px solid #1646b3; padding-bottom: 12px; margin-bottom: 20px; }
        .header h1 { margin: 0 0 6px; font-size: 26px; }
        .header p { margin: 0; color: #475569; }
        .record-title { margin-bottom: 14px; }
        .record-title h2 { margin: 0 0 8px; font-size: 24px; }
        .record-title p { margin: 0; color: #475569; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 18px 0; }
        .item { border: 1px solid #dbe4f0; border-radius: 10px; padding: 10px 12px; }
        .item strong { display: block; margin-bottom: 4px; font-size: 13px; color: #334155; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${escapeHtml(settingsData.portalTitle)}</h1>
        <p>${escapeHtml(settingsData.orgName)}</p>
      </div>

      <div class="record-title">
        <h2>${escapeHtml(record.name)}</h2>
        <p>${escapeHtml(isProfessorRecord(record) ? "Professor" : (record.personType || "-"))}</p>
      </div>

      <div class="grid">
        <div class="item"><strong>Função / vínculo</strong>${escapeHtml(record.role || "-")}</div>
        <div class="item"><strong>Lotação / escola</strong>${escapeHtml(record.department || "-")}</div>
        <div class="item"><strong>Cargo</strong>${escapeHtml(record.position || "-")}</div>
        <div class="item"><strong>Situação</strong>${escapeHtml(record.status || "-")}</div>
        <div class="item"><strong>CPF</strong>${escapeHtml(record.cpf || "-")}</div>
        <div class="item"><strong>Telefone</strong>${escapeHtml(record.phone || "-")}</div>
        <div class="item"><strong>Férias</strong>${escapeHtml(formatInstitutionVacation(record.vacation))}</div>
        <div class="item"><strong>Licenças</strong>${escapeHtml(record.license || "-")}</div>
        <div class="item"><strong>Afastamento</strong>${escapeHtml(formatInstitutionLeaveStatus(record.leaveStatus))}</div>
        <div class="item"><strong>Documento de afastamento</strong>${escapeHtml(record.leaveDocumentName || "Nenhum documento anexado")}</div>
        <div class="item" style="grid-column: span 2;"><strong>Endereço</strong>${escapeHtml(record.address || "-")}</div>
        <div class="item" style="grid-column: span 2;"><strong>E-mail</strong>${escapeHtml(record.email || "-")}</div>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank", "width=980,height=760");
  if (!printWindow) {
    showToast("Não foi possível abrir a janela de impressão.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 300);
}

function openModal(id) {
  document.getElementById(id).classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
  const anyOpen = [...document.querySelectorAll(".modal")].some(m => !m.classList.contains("hidden"));
  if (!anyOpen) document.body.style.overflow = "";
}

async function handleAdminLogin(event) {
  event.preventDefault();
  const email = els.adminUser.value.trim();
  const password = els.adminPass.value.trim();

  if (!email || !password) {
    showToast("Informe e-mail e senha.");
    return;
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    adminLogged = true;
    adminUserEmail = data?.user?.email || email;
    await loadData();
    renderAll();
    renderAdminState();
    addAudit("Login", "Sessão", adminUserEmail || "Administrador", "Acesso autenticado via Supabase");
    renderAuditTable();
    showToast("Login realizado com sucesso.");
  } catch (error) {
    console.error("Erro ao autenticar no Supabase:", error);
    showToast(error?.message || "Não foi possível autenticar com o Supabase.");
  }
}

async function logoutAdmin() {
  try {
    const email = adminUserEmail || "Administrador";
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    adminLogged = false;
    adminUserEmail = "";
    addAudit("Logout", "Sessão", email, "Encerramento da sessão autenticada");
    renderAuditTable();
    await loadData();
    renderAll();
    renderAdminState();
    clearDocumentForm();
    clearCategoryForm();
    clearInstitutionalForm();
    showToast("Sessão encerrada.");
  } catch (error) {
    console.error("Erro ao encerrar sessão no Supabase:", error);
    showToast(error?.message || "Não foi possível encerrar a sessão.");
  }
}

async function syncAuthSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;

    const session = data?.session || null;
    adminLogged = !!session;
    adminUserEmail = session?.user?.email || "";
  } catch (error) {
    console.error("Erro ao verificar sessão do Supabase:", error);
    adminLogged = false;
    adminUserEmail = "";
  }
}

function bindAuthListener() {
  supabase.auth.onAuthStateChange(async (_event, session) => {
    adminLogged = !!session;
    adminUserEmail = session?.user?.email || "";
    if (Object.keys(els).length) {
      await loadData();
      renderAll();
      renderAdminState();
    }
  });
}

function subscribeSettingsRealtime() {
  if (settingsRealtimeChannel) return;

  try {
    settingsRealtimeChannel = supabase
      .channel("public-settings-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: DB_TABLES.settings },
        async payload => {
          const row = payload?.new;
          if (row?.id === SETTINGS_ROW_ID && row?.data) {
            settingsData = {
              ...createDefaultSettings(),
              ...(row.data || {})
            };
            applySettingsToUI();
            renderExecutiveBanner();
            renderPublicStats();
            renderPublicStudentsDonut();
            renderPublicStaffDonut();
          }
        }
      )
      .subscribe();
  } catch (error) {
    console.error("Não foi possível ativar a atualização em tempo real das configurações:", error);
  }
}

function renderAdminState() {
  els.adminLoginView.classList.toggle("hidden", adminLogged);
  els.adminApp.classList.toggle("hidden", !adminLogged);
  els.adminNav.classList.toggle("hidden", !adminLogged);
  els.adminSidebarActions.classList.toggle("hidden", !adminLogged);

  if (adminLogged) {
    switchAdminTab(currentTab);
  } else {
    els.adminUser.value = adminUserEmail || "";
    els.adminPass.value = "";
  }
}

function switchAdminTab(tab) {
  currentTab = tab;

  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });

  document.querySelectorAll(".tab-panel").forEach(panel => {
    panel.classList.toggle("hidden", panel.dataset.panel !== tab);
  });

  if (tab === "dashboard") {
    renderAdminStats();
    renderSphereBars();
    renderRecentDocuments();
    renderActivityList();
  }
  if (tab === "institutional") {
    renderInstitutionalStats();
    renderInstitutionalTable();
    renderInstitutionalDetail(currentInstitutionRecordId);
  }
  if (tab === "staff-form" || tab === "student-form") {
    renderInstitutionalTable();
    renderInstitutionalDetail(currentInstitutionRecordId);
  }
  if (tab === "documents") renderAdminDocumentsTable();
  if (tab === "categories") renderCategoriesTable();
  if (tab === "form") populateCategorySelects();
  if (tab === "reports") renderReportsCenter();
  if (tab === "audit") renderAuditTable();
  if (tab === "settings") fillSettingsForm();
}

function renderAdminStats() {
  const total = documentsData.length;
  const active = documentsData.filter(d => d.active).length;
  const hidden = documentsData.filter(d => !d.active).length;
  const featured = documentsData.filter(d => d.featured).length;
  const summary = getInstitutionalSummary();

  els.adminStatsGrid.innerHTML = `
    ${statCard("Total de documentos", total)}
    ${statCard("Documentos ativos", active)}
    ${statCard("Documentos ocultos", hidden)}
    ${statCard("Destaques", featured)}
    ${statCard("Alunos cadastrados", summary.students)}
    ${statCard("Funcionários cadastrados", summary.staff)}
    ${statCard("Professores", summary.teachers)}
    ${statCard("Registros institucionais", summary.total)}
  `;
}

function renderSphereBars() {
  const counts = {
    Federal: documentsData.filter(d => d.administrativeSphere === "Federal").length,
    Estadual: documentsData.filter(d => d.administrativeSphere === "Estadual").length,
    Municipal: documentsData.filter(d => d.administrativeSphere === "Municipal").length
  };

  const max = Math.max(1, ...Object.values(counts));

  els.sphereBars.innerHTML = Object.entries(counts).map(([label, value]) => `
    <div class="bar-item">
      <div class="bar-head">
        <span>${escapeHtml(label)}</span>
        <span>${escapeHtml(String(value))}</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${(value / max) * 100}%"></div>
      </div>
    </div>
  `).join("");
}

function renderRecentDocuments() {
  const latest = [...documentsData]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  els.recentDocumentsBody.innerHTML = latest.map(doc => `
    <tr>
      <td>
        <strong>${escapeHtml(doc.title)}</strong>
        <small>${escapeHtml(doc.lawOrDocumentNumber || "Sem número")}</small>
      </td>
      <td>${escapeHtml(doc.protocol || "-")}</td>
      <td>${escapeHtml(doc.documentType)}</td>
      <td>${escapeHtml(doc.categoryName || "-")}</td>
      <td>${escapeHtml(doc.administrativeSphere || "-")}</td>
      <td>${escapeHtml(String(doc.year || "-"))}</td>
      <td>${doc.active ? `<span class="badge badge-green">Ativo</span>` : `<span class="badge badge-red">Oculto</span>`}</td>
    </tr>
  `).join("");
}

function renderActivityList() {
  const latest = [...auditLogs].slice(0, 5);

  els.activityList.innerHTML = latest.map(log => `
    <div class="activity-item">
      <strong>${escapeHtml(log.action)} — ${escapeHtml(log.targetLabel)}</strong>
      <span>${escapeHtml(formatDateTime(log.time))}</span>
    </div>
  `).join("");
}

function getInstitutionalSummary(rows = institutionalRecords) {
  const normalizedRows = rows.map(normalizeInstitutionalRecord);
  const total = normalizedRows.length;
  const students = normalizedRows.filter(record => record.personType === "Aluno").length;
  const staff = normalizedRows.filter(record => record.personType === "Funcionário").length;
  const teachers = normalizedRows.filter(isProfessorRecord).length;
  const active = normalizedRows.filter(record => record.status === "Ativo").length;
  const away = normalizedRows.filter(record => record.status === "Afastado").length;

  return { total, students, staff, teachers, active, away };
}

function getPublicInstitutionalSummary() {
  const stored = settingsData?.publicInstitutionalSummary;

  if (stored && typeof stored === "object") {
    return {
      total: Number(stored.total || 0),
      students: Number(stored.students || 0),
      staff: Number(stored.staff || 0),
      teachers: Number(stored.teachers || 0),
      active: Number(stored.active || 0),
      away: Number(stored.away || 0)
    };
  }

  return getInstitutionalSummary();
}

function getStudentsBySchool(rows = institutionalRecords) {
  const normalizedRows = rows.map(normalizeInstitutionalRecord);
  const studentRows = normalizedRows.filter(record => record.personType === "Aluno");
  const counts = new Map();

  studentRows.forEach(record => {
    const school = (record.department || "").trim() || "Sem escola definida";
    counts.set(school, (counts.get(school) || 0) + 1);
  });

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "pt-BR"));
}

function getPublicStudentsBySchool() {
  const stored = Array.isArray(settingsData?.publicStudentsBySchool)
    ? settingsData.publicStudentsBySchool
    : [];

  if (stored.length) {
    return stored
      .map(item => ({
        label: String(item?.label || "Sem escola definida"),
        count: Number(item?.count || 0)
      }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "pt-BR"));
  }

  return getStudentsBySchool();
}


function getStaffBySchool(rows = institutionalRecords) {
  const normalizedRows = rows.map(normalizeInstitutionalRecord);
  const staffRows = normalizedRows.filter(record => record.personType !== "Aluno");
  const counts = new Map();

  staffRows.forEach(record => {
    const school = (record.department || "").trim() || "Sem escola definida";
    counts.set(school, (counts.get(school) || 0) + 1);
  });

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "pt-BR"));
}

function getPublicStaffBySchool() {
  const stored = Array.isArray(settingsData?.publicStaffBySchool)
    ? settingsData.publicStaffBySchool
    : [];

  if (stored.length) {
    return stored
      .map(item => ({
        label: String(item?.label || "Sem escola definida"),
        count: Number(item?.count || 0)
      }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "pt-BR"));
  }

  return getStaffBySchool();
}

function syncPublicInstitutionalSummary() {
  const normalizedRows = institutionalRecords.map(normalizeInstitutionalRecord);
  settingsData.publicInstitutionalSummary = getInstitutionalSummary(normalizedRows);
  settingsData.publicStudentsBySchool = getStudentsBySchool(normalizedRows);
  settingsData.publicStaffBySchool = getStaffBySchool(normalizedRows);
}

function isProfessorRecord(record) {
  return record.personType === "Professor" || (
    record.personType === "Funcionário" && [record.role, record.position].some(value => normalizeText(value).includes("professor"))
  );
}

function getInstitutionTypeBadge(record) {
  if (isProfessorRecord(record)) return '<span class="badge badge-green">Professor</span>';
  if (record.personType === "Funcionário") return '<span class="badge badge-yellow">Funcionário</span>';
  return '<span class="badge">Aluno</span>';
}

function getInstitutionStatusBadge(status) {
  if (status === "Ativo") return '<span class="badge badge-green">Ativo</span>';
  if (status === "Afastado") return '<span class="badge badge-yellow">Afastado</span>';
  if (status === "Desligado") return '<span class="badge badge-red">Desligado</span>';
  return `<span class="badge">${escapeHtml(status || "-")}</span>`;
}

function renderInstitutionalStats() {
  const filtered = getFilteredInstitutionalRecords();
  const summary = getInstitutionalSummary(filtered);

  els.institutionalStatsGrid.innerHTML = `
    ${statCard("Total filtrado", summary.total)}
    ${statCard("Alunos", summary.students)}
    ${statCard("Funcionários", summary.staff)}
    ${statCard("Professores", summary.teachers)}
    ${statCard("Ativos", summary.active)}
    ${statCard("Afastados", summary.away)}
  `;
}

function getFilteredInstitutionalRecords() {
  const term = normalizeText(els.institutionSearchInput?.value || "");
  const type = els.institutionTypeFilter?.value || "";
  const status = els.institutionStatusFilter?.value || "";

  return [...institutionalRecords]
    .map(normalizeInstitutionalRecord)
    .filter(record => {
      const matchesTerm = !term || [
        record.name,
        record.cpf,
        record.phone,
        record.email,
        record.address,
        record.role,
        record.department,
        record.position,
        record.status,
        record.vacation,
        record.license,
        record.leaveStatus,
        record.leaveDocumentName
      ].some(value => normalizeText(value).includes(term));

      const matchesType = !type || (type === "Professor" ? isProfessorRecord(record) : record.personType === type);
      const matchesStatus = !status || record.status === status;

      return matchesTerm && matchesType && matchesStatus;
    })
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

function renderInstitutionalTable() {
  const rows = getFilteredInstitutionalRecords();
  renderInstitutionalStats();

  els.institutionRecordsBody.innerHTML = rows.length ? rows.map(record => `
    <tr>
      <td><strong>${escapeHtml(record.name)}</strong></td>
      <td>${getInstitutionTypeBadge(record)}</td>
      <td>${escapeHtml(record.department || "-")}</td>
      <td>${escapeHtml(record.position || "-")}</td>
      <td>${getInstitutionStatusBadge(record.status)}</td>
      <td>${escapeHtml(record.cpf || "-")}</td>
      <td>
        <div class="row-actions">
          <button class="btn btn-light" data-action="view-person" data-id="${record.id}">Ficha</button>
          <button class="btn btn-light" data-action="edit-person" data-id="${record.id}">Editar</button>
          <button class="btn btn-light" data-action="print-person" data-id="${record.id}">Imprimir</button>
          <button class="btn btn-danger" data-action="delete-person" data-id="${record.id}">Excluir</button>
        </div>
      </td>
    </tr>
  `).join("") : `
    <tr>
      <td colspan="7"><div class="empty-card">Nenhum registro institucional encontrado.</div></td>
    </tr>
  `;
}

function formatInstitutionVacation(value) {
  if (value === "Normais") return "Férias normais";
  if (value === "Premium") return "Férias Premium";
  if (value === "Não") return "Não";
  return value || "-";
}

function formatInstitutionLeaveStatus(value) {
  if (value === "Sim") return "Com afastamento";
  if (value === "Não") return "Sem afastamento";
  return value || "-";
}

function renderInstitutionLeaveDocumentSlot(data = "", name = "") {
  if (!els.detailInstitutionLeaveDocumentWrap) return;

  if (!data) {
    els.detailInstitutionLeaveDocumentWrap.textContent = "Nenhum documento anexado.";
    return;
  }

  els.detailInstitutionLeaveDocumentWrap.innerHTML = `<a class="btn btn-light btn-full" href="${escapeHtml(data)}" download="${escapeHtml(name || "documento-afastamento")}" target="_blank" rel="noopener">Abrir documento anexado</a>`;
}

function updateInstitutionLeaveDocumentPreview(data = "", name = "") {
  if (!els.staffInstitutionLeaveDocumentPreview) return;

  if (!data) {
    els.staffInstitutionLeaveDocumentPreview.textContent = "Nenhum documento anexado.";
    return;
  }

  const safeData = escapeHtml(data);
  const safeName = escapeHtml(name || "documento-afastamento");
  els.staffInstitutionLeaveDocumentPreview.innerHTML = `<a href="${safeData}" download="${safeName}" target="_blank" rel="noopener">${safeName}</a>`;
}

function handleInstitutionLeaveFileChange(event, mode = "staff") {
  if (mode !== "staff") return;

  const file = event.target.files?.[0];
  if (!file) {
    els.staffInstitutionLeaveDocumentData.value = "";
    els.staffInstitutionLeaveDocumentName.value = "";
    updateInstitutionLeaveDocumentPreview();
    return;
  }

  const allowedTypes = ["image/png", "application/pdf"];
  const isPngByName = file.name.toLowerCase().endsWith(".png");
  const isPdfByName = file.name.toLowerCase().endsWith(".pdf");

  if (!allowedTypes.includes(file.type) && !isPngByName && !isPdfByName) {
    showToast("Anexe somente arquivo PNG ou PDF.");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const result = String(reader.result || "");
    els.staffInstitutionLeaveDocumentData.value = result;
    els.staffInstitutionLeaveDocumentName.value = file.name;
    updateInstitutionLeaveDocumentPreview(result, file.name);
    showToast("Documento de afastamento anexado.");
  };
  reader.readAsDataURL(file);
}

function getInstitutionalEditingId(mode) {
  return mode === "student" ? els.studentInstitutionRecordId.value : els.staffInstitutionRecordId.value;
}

function buildInstitutionalPayload(mode) {
  const updatedAt = new Date().toISOString();

  if (mode === "student") {
    return {
      name: els.studentInstitutionName.value.trim(),
      personType: "Aluno",
      role: (els.studentInstitutionRole?.value || "Aluno").trim() || "Aluno",
      department: els.studentInstitutionDepartment.value.trim(),
      position: els.studentInstitutionPosition.value.trim(),
      status: els.studentInstitutionStatus.value,
      vacation: "",
      license: "",
      leaveStatus: "",
      leaveDocumentData: "",
      leaveDocumentName: "",
      cpf: formatCpf(els.studentInstitutionCpf?.value || ""),
      address: els.studentInstitutionAddress.value.trim(),
      phone: els.studentInstitutionPhone.value.trim(),
      email: (els.studentInstitutionEmail?.value || "").trim(),
      updatedAt
    };
  }

  return {
    name: els.staffInstitutionName.value.trim(),
    personType: els.staffInstitutionPersonType.value || "Funcionário",
    role: els.staffInstitutionRole.value.trim(),
    department: els.staffInstitutionDepartment.value.trim(),
    position: els.staffInstitutionPosition.value.trim(),
    status: els.staffInstitutionStatus.value,
    vacation: els.staffInstitutionVacation.value,
    license: els.staffInstitutionLicense.value,
    leaveStatus: els.staffInstitutionLeaveStatus.value,
    leaveDocumentData: els.staffInstitutionLeaveDocumentData.value || "",
    leaveDocumentName: els.staffInstitutionLeaveDocumentName.value || "",
    cpf: formatCpf(els.staffInstitutionCpf.value),
    address: els.staffInstitutionAddress.value.trim(),
    phone: els.staffInstitutionPhone.value.trim(),
    email: els.staffInstitutionEmail.value.trim(),
    updatedAt
  };
}

function validateInstitutionalPayload(payload, mode) {
  if (mode === "student") {
    if (!payload.name || !payload.department || !payload.position || !payload.status || !payload.address) {
      showToast("Preencha os campos obrigatórios da ficha do aluno.");
      return false;
    }
  } else {
    if (!payload.name || !payload.role || !payload.department || !payload.position || !payload.status || !payload.cpf || !payload.address) {
      showToast("Preencha os campos obrigatórios da ficha de funcionário / professor.");
      return false;
    }
  }

  if (mode === "staff" && payload.leaveStatus === "Sim" && !payload.leaveDocumentData) {
    showToast("Anexe o documento de afastamento em PNG ou PDF.");
    return false;
  }

  if (mode === "staff" && payload.leaveStatus !== "Sim") {
    payload.leaveDocumentData = "";
    payload.leaveDocumentName = "";
  }

  const normalizedCpf = normalizeCpf(payload.cpf);
  if (normalizedCpf) {
    if (normalizedCpf.length !== 11) {
      showToast("Informe um CPF válido com 11 dígitos.");
      return false;
    }

    const duplicate = institutionalRecords.find(item => item.id !== getInstitutionalEditingId(mode) && normalizeCpf(item.cpf) === normalizedCpf);
    if (duplicate) {
      showToast("Já existe uma ficha cadastrada com esse CPF.");
      return false;
    }
  }

  return true;
}

function renderInstitutionalDetail(recordId) {
  const rawRecord = institutionalRecords.find(item => item.id === recordId);
  const record = rawRecord ? normalizeInstitutionalRecord(rawRecord) : null;
  currentInstitutionRecordId = record?.id || null;

  if (!record) {
    els.institutionDetailEmpty.classList.remove("hidden");
    els.institutionDetailCard.classList.add("hidden");
    setText(els.detailInstitutionName, "-");
    setText(els.detailInstitutionType, "-");
    setText(els.detailInstitutionRole, "-");
    setText(els.detailInstitutionDepartment, "-");
    setText(els.detailInstitutionPosition, "-");
    setText(els.detailInstitutionStatus, "-");
    setText(els.detailInstitutionCpf, "-");
    setText(els.detailInstitutionVacation, "-");
    setText(els.detailInstitutionLicense, "-");
    setText(els.detailInstitutionLeaveStatus, "-");
    renderInstitutionLeaveDocumentSlot();
    setText(els.detailInstitutionAddress, "-");
    setText(els.detailInstitutionPhone, "-");
    setText(els.detailInstitutionEmail, "-");
    return;
  }

  els.institutionDetailEmpty.classList.add("hidden");
  els.institutionDetailCard.classList.remove("hidden");
  setText(els.detailInstitutionName, record.name || "-");
  setText(els.detailInstitutionType, isProfessorRecord(record) ? "Professor" : (record.personType || "-"));
  setText(els.detailInstitutionRole, record.role || "-");
  setText(els.detailInstitutionDepartment, record.department || "-");
  setText(els.detailInstitutionPosition, record.position || "-");
  setText(els.detailInstitutionStatus, record.status || "-");
  setText(els.detailInstitutionCpf, record.cpf || "-");
  setText(els.detailInstitutionVacation, formatInstitutionVacation(record.vacation));
  setText(els.detailInstitutionLicense, record.license || "-");
  setText(els.detailInstitutionLeaveStatus, formatInstitutionLeaveStatus(record.leaveStatus));
  renderInstitutionLeaveDocumentSlot(record.leaveDocumentData, record.leaveDocumentName);
  setText(els.detailInstitutionAddress, record.address || "-");
  setText(els.detailInstitutionPhone, record.phone || "-");
  setText(els.detailInstitutionEmail, record.email || "-");
}

async function handleInstitutionalTableClicks(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const { action, id } = button.dataset;
  const record = institutionalRecords.find(item => item.id === id);
  if (!record) return;

  if (action === "view-person") {
    renderInstitutionalDetail(record.id);
    return;
  }

  if (action === "edit-person") {
    fillInstitutionalForm(record);
    renderInstitutionalDetail(record.id);
    switchAdminTab(normalizeInstitutionalRecord(record).personType === "Aluno" ? "student-form" : "staff-form");
    return;
  }

  if (action === "print-person") {
    renderInstitutionalDetail(record.id);
    printInstitutionalRecord(record.id);
    return;
  }

  if (action === "delete-person") {
    const confirmed = window.confirm(`Excluir a ficha de "${record.name}"?`);
    if (!confirmed) return;

    institutionalRecords = institutionalRecords.filter(item => item.id !== record.id);
    addAudit("Exclusão", "Controle Institucional", record.name, "Ficha institucional removida");
    await saveData();
    clearInstitutionalForm();
    renderInstitutionalDetail(currentInstitutionRecordId === record.id ? null : currentInstitutionRecordId);
    renderInstitutionalTable();
    renderAdminStats();
    renderPublicStats();
    renderPublicStudentsDonut();
    renderPublicStaffDonut();
    showToast("Ficha institucional excluída.");
  }
}

async function handleSaveInstitutionalRecord(event, mode = "staff") {
  event.preventDefault();

  const payload = buildInstitutionalPayload(mode);
  if (!validateInstitutionalPayload(payload, mode)) return;

  const editingId = getInstitutionalEditingId(mode);
  const isEditing = Boolean(editingId);

  if (isEditing) {
    const index = institutionalRecords.findIndex(item => item.id === editingId);
    if (index >= 0) {
      institutionalRecords[index] = {
        ...institutionalRecords[index],
        ...payload
      };
      addAudit("Atualização", "Controle Institucional", payload.name, "Ficha institucional atualizada");
      showToast(mode === "student" ? "Ficha de aluno atualizada com sucesso." : "Ficha de funcionário / professor atualizada com sucesso.");
      currentInstitutionRecordId = institutionalRecords[index].id;
    }
  } else {
    const newRecord = {
      id: uid(),
      createdAt: new Date().toISOString(),
      ...payload
    };
    institutionalRecords.unshift(newRecord);
    addAudit("Cadastro", "Controle Institucional", payload.name, "Nova ficha institucional cadastrada");
    showToast(mode === "student" ? "Ficha de aluno cadastrada com sucesso." : "Ficha de funcionário / professor cadastrada com sucesso.");
    currentInstitutionRecordId = newRecord.id;
  }

  await saveData();
  clearInstitutionalForm();
  renderInstitutionalTable();
  renderInstitutionalDetail(currentInstitutionRecordId);
  renderAdminStats();
  renderPublicStats();
  renderPublicStudentsDonut();
  renderPublicStaffDonut();
}

function fillInstitutionalForm(record) {
  const normalized = normalizeInstitutionalRecord(record);
  const isStudent = normalized.personType === "Aluno";

  if (isStudent) {
    clearInstitutionalForm("staff");
    els.studentInstitutionRecordId.value = normalized.id || "";
    els.studentInstitutionName.value = normalized.name || "";
    if (els.studentInstitutionRole) els.studentInstitutionRole.value = normalized.role || "Aluno";
    els.studentInstitutionDepartment.value = normalized.department || "";
    els.studentInstitutionPosition.value = normalized.position || "";
    els.studentInstitutionStatus.value = normalized.status || "";
    if (els.studentInstitutionCpf) els.studentInstitutionCpf.value = normalized.cpf || "";
    els.studentInstitutionAddress.value = normalized.address || "";
    els.studentInstitutionPhone.value = normalized.phone || "";
    if (els.studentInstitutionEmail) els.studentInstitutionEmail.value = normalized.email || "";
    els.studentInstitutionFormTitle.textContent = "Editar ficha de aluno";
    return;
  }

  clearInstitutionalForm("student");
  els.staffInstitutionRecordId.value = normalized.id || "";
  els.staffInstitutionName.value = normalized.name || "";
  els.staffInstitutionPersonType.value = normalized.personType === "Professor" ? "Professor" : "Funcionário";
  els.staffInstitutionRole.value = normalized.role || "";
  els.staffInstitutionDepartment.value = normalized.department || "";
  els.staffInstitutionPosition.value = normalized.position || "";
  els.staffInstitutionStatus.value = normalized.status || "Ativo";
  els.staffInstitutionVacation.value = normalized.vacation || "";
  els.staffInstitutionLicense.value = normalized.license || "";
  els.staffInstitutionLeaveStatus.value = normalized.leaveStatus || "";
  els.staffInstitutionLeaveDocumentData.value = normalized.leaveDocumentData || "";
  els.staffInstitutionLeaveDocumentName.value = normalized.leaveDocumentName || "";
  updateInstitutionLeaveDocumentPreview(normalized.leaveDocumentData || "", normalized.leaveDocumentName || "");
  els.staffInstitutionCpf.value = normalized.cpf || "";
  els.staffInstitutionAddress.value = normalized.address || "";
  els.staffInstitutionPhone.value = normalized.phone || "";
  els.staffInstitutionEmail.value = normalized.email || "";
  els.staffInstitutionFormTitle.textContent = "Editar ficha de funcionário / professor";
}

function clearInstitutionalForm(mode = "all") {
  if (mode === "all" || mode === "staff") {
    els.staffInstitutionForm.reset();
    els.staffInstitutionRecordId.value = "";
    els.staffInstitutionPersonType.value = "Funcionário";
    els.staffInstitutionStatus.value = "";
    els.staffInstitutionVacation.value = "";
    els.staffInstitutionLicense.value = "";
    els.staffInstitutionLeaveStatus.value = "";
    els.staffInstitutionLeaveDocumentData.value = "";
    els.staffInstitutionLeaveDocumentName.value = "";
    if (els.staffInstitutionLeaveFile) els.staffInstitutionLeaveFile.value = "";
    updateInstitutionLeaveDocumentPreview();
    els.staffInstitutionFormTitle.textContent = "Cadastrar ficha de funcionário / professor";
  }

  if (mode === "all" || mode === "student") {
    els.studentInstitutionForm.reset();
    els.studentInstitutionRecordId.value = "";
    els.studentInstitutionStatus.value = "";
    els.studentInstitutionFormTitle.textContent = "Cadastrar ficha de aluno";
  }
}

function getFilteredAdminDocuments() {
  const search = normalizeText(els.adminSearchInput.value.trim());
  const status = els.adminStatusFilter.value;
  const sphere = els.adminSphereFilter.value;

  let result = [...documentsData];

  if (search) {
    result = result.filter(doc => normalizeText([
      doc.title,
      doc.protocol,
      doc.lawOrDocumentNumber,
      doc.categoryName
    ].join(" ")).includes(search));
  }

  if (status === "active") result = result.filter(doc => doc.active);
  if (status === "inactive") result = result.filter(doc => !doc.active);
  if (sphere) result = result.filter(doc => doc.administrativeSphere === sphere);

  result.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
  return result;
}

function renderAdminDocumentsTable() {
  const ordered = getFilteredAdminDocuments();

  els.adminDocumentsBody.innerHTML = ordered.map(doc => `
    <tr>
      <td>
        <strong>${escapeHtml(doc.title)}</strong>
        <small>${escapeHtml(doc.lawOrDocumentNumber || "Sem número")}</small>
      </td>
      <td>${escapeHtml(doc.protocol || "-")}</td>
      <td>${escapeHtml(doc.documentType)}</td>
      <td>${escapeHtml(doc.categoryName || "-")}</td>
      <td>${escapeHtml(doc.administrativeSphere || "-")}</td>
      <td>${escapeHtml(String(doc.year || "-"))}</td>
      <td>${doc.active ? `<span class="badge badge-green">Ativo</span>` : `<span class="badge badge-red">Oculto</span>`}</td>
      <td>
        <div class="row-actions">
          <button class="btn btn-light" data-action="edit-doc" data-id="${doc.id}">Editar</button>
          <button class="btn btn-light" data-action="toggle-doc" data-id="${doc.id}">
            ${doc.active ? "Ocultar" : "Ativar"}
          </button>
          <button class="btn btn-danger" data-action="delete-doc" data-id="${doc.id}">Excluir</button>
        </div>
      </td>
    </tr>
  `).join("");
}

async function handleAdminDocumentsClicks(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const { action, id } = button.dataset;
  const doc = documentsData.find(item => item.id === id);
  if (!doc) return;

  if (action === "edit-doc") {
    fillDocumentForm(doc);
    switchAdminTab("form");
    return;
  }

  if (action === "toggle-doc") {
    doc.active = !doc.active;
    doc.updatedAt = new Date().toISOString();
    await saveData();
    addAudit("Alteração", "Documento", doc.title, doc.active ? "Documento ativado" : "Documento ocultado");
    await saveData();
    renderAll();
    showToast(doc.active ? "Documento ativado." : "Documento ocultado.");
    return;
  }

  if (action === "delete-doc") {
    const confirmed = window.confirm(`Excluir o documento "${doc.title}"?`);
    if (!confirmed) return;
    documentsData = documentsData.filter(item => item.id !== id);
    await saveData();
    addAudit("Exclusão", "Documento", doc.title, "Documento removido");
    await saveData();
    renderAll();
    showToast("Documento excluído.");
  }
}

function populateCategorySelects() {
  const options = categories
    .filter(c => c.active)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
    .map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`)
    .join("");

  els.categoryId.innerHTML = `<option value="">Selecione</option>${options}`;
}

async function handleSaveDocument(event) {
  event.preventDefault();

  const category = categories.find(c => c.id === els.categoryId.value);
  if (!category) {
    showToast("Selecione uma categoria válida.");
    return;
  }

  const isEditing = Boolean(els.docId.value);
  const protocol = els.protocol.value || generateProtocol();

  const payload = {
    title: els.title.value.trim(),
    slug: slugify(els.title.value.trim()),
    protocol,
    documentType: els.documentType.value,
    categoryId: category.id,
    categoryName: category.name,
    administrativeSphere: els.administrativeSphere.value,
    lawOrDocumentNumber: els.lawOrDocumentNumber.value.trim(),
    year: Number(els.year.value),
    issuingBody: els.issuingBody.value.trim(),
    jurisdictionState: els.jurisdictionState.value.trim(),
    jurisdictionCity: els.jurisdictionCity.value.trim(),
    publicationDate: els.publicationDate.value,
    summary: els.summary.value.trim(),
    fullDescription: els.fullDescription.value.trim(),
    keywords: splitKeywords(els.keywords.value),
    pdfUrl: els.pdfUrl.value.trim(),
    coverImageData: els.coverImageData.value || "",
    active: els.active.checked,
    featured: els.featured.checked,
    updatedAt: new Date().toISOString()
  };

  if (!payload.title || !payload.documentType || !payload.administrativeSphere || !payload.year || !payload.issuingBody || !payload.summary || !payload.fullDescription) {
    showToast("Preencha todos os campos obrigatórios.");
    return;
  }

  const duplicate = documentsData.find(item =>
    item.id !== els.docId.value &&
    normalizeText(item.title) === normalizeText(payload.title) &&
    normalizeText(item.lawOrDocumentNumber || "") === normalizeText(payload.lawOrDocumentNumber || "")
  );

  if (duplicate) {
    showToast("Já existe um documento com esse título e número.");
    return;
  }

  if (isEditing) {
    const index = documentsData.findIndex(item => item.id === els.docId.value);
    if (index >= 0) {
      documentsData[index] = {
        ...documentsData[index],
        ...payload
      };
      addAudit("Atualização", "Documento", payload.title, "Documento atualizado");
      showToast("Documento atualizado com sucesso.");
    }
  } else {
    documentsData.unshift({
      id: uid(),
      createdAt: new Date().toISOString(),
      ...payload
    });
    addAudit("Cadastro", "Documento", payload.title, "Novo documento cadastrado");
    showToast("Documento cadastrado com sucesso.");
  }

  await saveData();
  clearDocumentForm();
  currentPage = 1;
  renderAll();
  switchAdminTab("documents");
}

function fillDocumentForm(doc) {
  els.docId.value = doc.id;
  els.protocol.value = doc.protocol || "";
  els.protocolView.value = doc.protocol || "";
  els.title.value = doc.title || "";
  els.lawOrDocumentNumber.value = doc.lawOrDocumentNumber || "";
  els.documentType.value = doc.documentType || "";
  populateCategorySelects();
  els.categoryId.value = doc.categoryId || "";
  els.administrativeSphere.value = doc.administrativeSphere || "";
  els.year.value = doc.year || "";
  els.issuingBody.value = doc.issuingBody || "";
  els.publicationDate.value = doc.publicationDate || "";
  els.jurisdictionState.value = doc.jurisdictionState || "";
  els.jurisdictionCity.value = doc.jurisdictionCity || "";
  els.summary.value = doc.summary || "";
  els.fullDescription.value = doc.fullDescription || "";
  els.keywords.value = (doc.keywords || []).join(", ");
  els.pdfUrl.value = doc.pdfUrl || "";
  els.coverImageData.value = doc.coverImageData || "";
  els.active.checked = !!doc.active;
  els.featured.checked = !!doc.featured;
  updateCoverPreview(doc.coverImageData || "");
  els.formTitle.textContent = "Editar documento";
}

function clearDocumentForm() {
  els.documentForm.reset();
  els.docId.value = "";
  els.protocol.value = "";
  els.protocolView.value = "";
  els.coverImageData.value = "";
  els.active.checked = true;
  els.featured.checked = false;
  els.formTitle.textContent = "Cadastrar documento";
  updateCoverPreview("");
}

function handleCoverUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showToast("Selecione apenas arquivos de imagem.");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const result = String(reader.result || "");
    els.coverImageData.value = result;
    updateCoverPreview(result);
    showToast("Capa carregada com sucesso.");
  };
  reader.readAsDataURL(file);
}

function updateCoverPreview(dataUrl) {
  if (dataUrl) {
    els.coverPreview.style.backgroundImage = `url("${dataUrl}")`;
    els.coverPreview.textContent = "";
  } else {
    els.coverPreview.style.backgroundImage = "";
    els.coverPreview.textContent = "Sem imagem";
  }
}

function renderCategoriesTable() {
  const ordered = [...categories].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  els.categoriesBody.innerHTML = ordered.map(category => `
    <tr>
      <td><strong>${escapeHtml(category.name)}</strong></td>
      <td>${category.active ? `<span class="badge badge-green">Ativa</span>` : `<span class="badge badge-red">Inativa</span>`}</td>
      <td>${escapeHtml(category.slug)}</td>
      <td>
        <div class="row-actions">
          <button class="btn btn-light" data-action="edit-category" data-id="${category.id}">Editar</button>
          <button class="btn btn-light" data-action="toggle-category" data-id="${category.id}">
            ${category.active ? "Desativar" : "Ativar"}
          </button>
          <button class="btn btn-danger" data-action="delete-category" data-id="${category.id}">Excluir</button>
        </div>
      </td>
    </tr>
  `).join("");
}

async function handleSaveCategory(event) {
  event.preventDefault();

  const name = els.categoryName.value.trim();
  if (!name) {
    showToast("Informe o nome da categoria.");
    return;
  }

  const duplicate = categories.find(item =>
    item.id !== els.categoryEditId.value &&
    normalizeText(item.name) === normalizeText(name)
  );

  if (duplicate) {
    showToast("Essa categoria já existe.");
    return;
  }

  if (els.categoryEditId.value) {
    const index = categories.findIndex(item => item.id === els.categoryEditId.value);
    if (index >= 0) {
      const oldName = categories[index].name;
      categories[index] = {
        ...categories[index],
        name,
        slug: slugify(name),
        active: els.categoryActive.checked
      };

      documentsData = documentsData.map(doc =>
        doc.categoryId === categories[index].id
          ? { ...doc, categoryName: name, updatedAt: new Date().toISOString() }
          : doc
      );

      addAudit("Atualização", "Categoria", name, `Categoria atualizada (antes: ${oldName})`);
      showToast(`Categoria "${oldName}" atualizada.`);
    }
  } else {
    categories.push({
      id: uid(),
      name,
      slug: slugify(name),
      active: els.categoryActive.checked
    });
    addAudit("Cadastro", "Categoria", name, "Nova categoria cadastrada");
    showToast("Categoria cadastrada.");
  }

  await saveData();
  clearCategoryForm();
  renderAll();
}

function clearCategoryForm() {
  els.categoryForm.reset();
  els.categoryEditId.value = "";
  els.categoryActive.checked = true;
}

async function handleCategoriesClicks(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const { action, id } = button.dataset;
  const category = categories.find(item => item.id === id);
  if (!category) return;

  if (action === "edit-category") {
    els.categoryEditId.value = category.id;
    els.categoryName.value = category.name;
    els.categoryActive.checked = !!category.active;
    return;
  }

  if (action === "toggle-category") {
    category.active = !category.active;
    await saveData();
    addAudit("Alteração", "Categoria", category.name, category.active ? "Categoria ativada" : "Categoria desativada");
    await saveData();
    renderAll();
    showToast(category.active ? "Categoria ativada." : "Categoria desativada.");
    return;
  }

  if (action === "delete-category") {
    const linkedDocs = documentsData.filter(doc => doc.categoryId === category.id);
    if (linkedDocs.length) {
      showToast("Não é possível excluir uma categoria que possui documentos vinculados.");
      return;
    }

    const confirmed = window.confirm(`Excluir a categoria "${category.name}"?`);
    if (!confirmed) return;

    categories = categories.filter(item => item.id !== id);
    await saveData();
    addAudit("Exclusão", "Categoria", category.name, "Categoria removida");
    await saveData();
    renderAll();
    showToast("Categoria excluída.");
  }
}

function getReportFilteredDocuments() {
  let result = [...documentsData];

  const sphere = els.reportSphereFilter.value;
  const category = els.reportCategoryFilter.value;
  const year = els.reportYearFilter.value;
  const status = els.reportStatusFilter.value;

  if (sphere) result = result.filter(doc => doc.administrativeSphere === sphere);
  if (category) result = result.filter(doc => doc.categoryName === category);
  if (year) result = result.filter(doc => String(doc.year) === year);
  if (status === "active") result = result.filter(doc => doc.active);
  if (status === "inactive") result = result.filter(doc => !doc.active);

  result.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
  return result;
}

function renderReportsCenter() {
  const rows = getReportFilteredDocuments();
  const active = rows.filter(doc => doc.active).length;
  const inactive = rows.filter(doc => !doc.active).length;
  const featured = rows.filter(doc => doc.featured).length;

  els.reportSummaryGrid.innerHTML = `
    ${statCard("Total filtrado", rows.length)}
    ${statCard("Ativos", active)}
    ${statCard("Ocultos", inactive)}
    ${statCard("Destaques", featured)}
  `;

  els.reportTableBody.innerHTML = rows.map(doc => `
    <tr>
      <td>${escapeHtml(doc.protocol || "-")}</td>
      <td><strong>${escapeHtml(doc.title)}</strong></td>
      <td>${escapeHtml(doc.categoryName || "-")}</td>
      <td>${escapeHtml(doc.administrativeSphere || "-")}</td>
      <td>${escapeHtml(String(doc.year || "-"))}</td>
      <td>${doc.active ? `<span class="badge badge-green">Ativo</span>` : `<span class="badge badge-red">Oculto</span>`}</td>
    </tr>
  `).join("");
}

function exportCsvReport() {
  const rows = getReportFilteredDocuments();

  const headers = [
    "Protocolo",
    "Título",
    "Tipo",
    "Categoria",
    "Esfera",
    "Ano",
    "Órgão Emissor",
    "Número",
    "Status"
  ];

  const lines = rows.map(doc => [
    doc.protocol || "",
    doc.title || "",
    doc.documentType || "",
    doc.categoryName || "",
    doc.administrativeSphere || "",
    doc.year || "",
    doc.issuingBody || "",
    doc.lawOrDocumentNumber || "",
    doc.active ? "Ativo" : "Oculto"
  ]);

  const csv = [headers, ...lines]
    .map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `relatorio-consulta-leis-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();

  URL.revokeObjectURL(url);
  showToast("Relatório CSV exportado.");
}

function printReportA4() {
  const rows = getReportFilteredDocuments();

  const tableRows = rows.map(doc => `
    <tr>
      <td>${escapeHtml(doc.protocol || "-")}</td>
      <td>${escapeHtml(doc.title || "-")}</td>
      <td>${escapeHtml(doc.categoryName || "-")}</td>
      <td>${escapeHtml(doc.administrativeSphere || "-")}</td>
      <td>${escapeHtml(String(doc.year || "-"))}</td>
      <td>${doc.active ? "Ativo" : "Oculto"}</td>
    </tr>
  `).join("");

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <title>Relatório Executivo Institucional</title>
      <style>
        body { font-family: Arial, Helvetica, sans-serif; margin: 24px; color: #0f172a; }
        .header { border-bottom: 3px solid #1646b3; padding-bottom: 12px; margin-bottom: 20px; }
        .header h1 { margin: 0 0 6px; font-size: 24px; }
        .header p { margin: 0; color: #475569; }
        .meta { margin-bottom: 16px; color: #475569; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #dbe4f0; padding: 8px 10px; text-align: left; font-size: 12px; vertical-align: top; }
        th { background: #eff6ff; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${escapeHtml(settingsData.portalTitle)} — Relatório Executivo</h1>
        <p>${escapeHtml(settingsData.orgName)}</p>
      </div>
      <div class="meta">
        Emitido em ${escapeHtml(new Date().toLocaleString("pt-BR"))} • Total filtrado: ${rows.length}
      </div>
      <table>
        <thead>
          <tr>
            <th>Protocolo</th>
            <th>Título</th>
            <th>Categoria</th>
            <th>Esfera</th>
            <th>Ano</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank", "width=1100,height=760");
  if (!printWindow) {
    showToast("Não foi possível abrir a janela de impressão.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 300);
}

function addAudit(action, targetType, targetLabel, detail = "") {
  auditLogs.unshift({
    id: uid(),
    time: new Date().toISOString(),
    action,
    targetType,
    targetLabel,
    detail
  });
  auditLogs = auditLogs.slice(0, 300);
  saveData();
}

function renderAuditTable() {
  els.auditTableBody.innerHTML = auditLogs.map(log => `
    <tr>
      <td>${escapeHtml(formatDateTime(log.time))}</td>
      <td>${escapeHtml(log.action)}</td>
      <td>${escapeHtml(log.targetType)}</td>
      <td>${escapeHtml(log.targetLabel)}</td>
      <td>${escapeHtml(log.detail || "-")}</td>
    </tr>
  `).join("");
}

function exportJsonBackup() {
  const payload = {
    version: 8,
    exportedAt: new Date().toISOString(),
    settings: settingsData,
    ui: uiData,
    audit: auditLogs,
    categories,
    documents: documentsData,
    institutionalRecords
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `consulta-leis-v8-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();

  URL.revokeObjectURL(url);
  showToast("Backup JSON exportado.");
}

function importJsonBackup(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result || "{}"));

      if (
        !Array.isArray(data.categories) ||
        !Array.isArray(data.documents) ||
        !Array.isArray(data.audit) ||
        typeof data.settings !== "object" ||
        typeof data.ui !== "object"
      ) {
        throw new Error("Estrutura inválida");
      }

      categories = data.categories;
      documentsData = data.documents;
      settingsData = data.settings;
      uiData = data.ui;
      auditLogs = data.audit;
      institutionalRecords = Array.isArray(data.institutionalRecords) ? data.institutionalRecords.map(normalizeInstitutionalRecord) : [];
      protocolCounter = documentsData.length + 1;
      saveData();
      clearDocumentForm();
      clearCategoryForm();
      clearInstitutionalForm();
      currentPage = 1;
      renderAll();
      addAudit("Importação", "Backup", "JSON", "Backup importado com sucesso");
      renderAuditTable();
      showToast("Backup importado com sucesso.");
    } catch {
      showToast("Arquivo JSON inválido.");
    } finally {
      els.importJsonInput.value = "";
    }
  };
  reader.readAsText(file);
}

function resetFilters() {
  els.searchInput.value = "";
  els.typeFilter.value = "";
  els.categoryFilter.value = "";
  els.sphereFilter.value = "";
  els.yearFilter.value = "";
  els.sortFilter.value = "recent";
  els.pageSizeSelect.value = "6";
  pageSize = 6;
  currentPage = 1;
  renderPublicDocuments();
}

async function restoreDemoData() {
  const confirmed = window.confirm("Restaurar os dados de exemplo? Os dados atuais serão substituídos.");
  if (!confirmed) return;

  resetToSeedData();
  await saveData();
  clearDocumentForm();
  clearCategoryForm();
  clearInstitutionalForm();
  currentPage = 1;
  renderAll();
  addAudit("Restauração", "Sistema", "Base de exemplo", "Base padrão restaurada");
  renderAuditTable();
  showToast("Dados de exemplo restaurados.");
}

function generateProtocol() {
  const year = new Date().getFullYear();
  const protocol = `EDU-${year}-${String(protocolCounter).padStart(4, "0")}`;
  protocolCounter++;
  return protocol;
}

function createDefaultSettings() {
  return {
    portalTitle: "Consulta de Leis Educacionais",
    orgName: "Secretaria de Educação",
    portalSubtitle: "Plataforma institucional para consulta, organização, acompanhamento e análise de leis, decretos, portarias, resoluções, pareceres e demais documentos educacionais.",
    footerText: "Sistema institucional local para organização e consulta de documentos educacionais.",
    footerLabel: "Portal de Normas e Legislação Educacional",
    bannerEnabled: true,
    bannerText: "Revise e valide as informações do documento antes de publicar alterações no acervo.",
    bannerTone: "info",
    publicInstitutionalSummary: {
      total: 0,
      students: 0,
      staff: 0,
      teachers: 0,
      active: 0,
      away: 0
    },
    publicStudentsBySchool: [],
    publicStaffBySchool: []
  };
}

function createSeedInstitutionalRecords() {
  return [
    {
      id: uid(),
      name: "Maria Eduarda Santos",
      personType: "Aluno",
      role: "Aluna da Educação Infantil",
      department: "EMEI Mundo Feliz",
      position: "Discente",
      status: "Ativo",
      vacation: "Não",
      license: "",
      leaveStatus: "Não",
      leaveDocumentData: "",
      leaveDocumentName: "",
      cpf: "123.456.789-01",
      address: "Rua das Flores, 120 - Centro",
      phone: "(38) 99911-2233",
      email: "maria.eduarda@exemplo.com",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uid(),
      name: "João Carlos Pereira",
      personType: "Funcionário",
      role: "Professor regente do Ensino Fundamental",
      department: "Escola Municipal Aurora",
      position: "Professor PEB I",
      status: "Ativo",
      vacation: "Normais",
      license: "Paternidade",
      leaveStatus: "Não",
      leaveDocumentData: "",
      leaveDocumentName: "",
      cpf: "234.567.890-12",
      address: "Av. Escolar, 45 - Bela Vista",
      phone: "(38) 99822-3344",
      email: "joao.pereira@exemplo.com",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uid(),
      name: "Ana Paula Rocha",
      personType: "Funcionário",
      role: "Atendimento e secretaria escolar",
      department: "Secretaria Municipal de Educação",
      position: "Secretária Escolar",
      status: "Afastado",
      vacation: "Premium",
      license: "Médica",
      leaveStatus: "Sim",
      leaveDocumentData: "",
      leaveDocumentName: "",
      cpf: "345.678.901-23",
      address: "Rua da Escola, 78 - São José",
      phone: "(38) 99733-4455",
      email: "ana.rocha@exemplo.com",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

function createSeedCategories() {
  return [
    { id: uid(), name: "Legislação Geral", slug: "legislacao-geral", active: true },
    { id: uid(), name: "Educação Infantil", slug: "educacao-infantil", active: true },
    { id: uid(), name: "Ensino Fundamental", slug: "ensino-fundamental", active: true },
    { id: uid(), name: "Educação Especial", slug: "educacao-especial", active: true },
    { id: uid(), name: "Gestão Escolar", slug: "gestao-escolar", active: true },
    { id: uid(), name: "Normas Administrativas", slug: "normas-administrativas", active: true },
    { id: uid(), name: "Avaliação", slug: "avaliacao", active: true }
  ];
}

function createSeedDocuments(categoriesSeed) {
  const byName = name => categoriesSeed.find(c => c.name === name);

  return [
    buildSeed({
      title: "Lei Municipal de Diretrizes da Educação Infantil",
      documentType: "Lei",
      category: byName("Educação Infantil"),
      administrativeSphere: "Municipal",
      lawOrDocumentNumber: "Lei 123/2024",
      year: 2024,
      issuingBody: "Secretaria Municipal de Educação",
      jurisdictionState: "MG",
      jurisdictionCity: "Carbonita",
      publicationDate: "2024-02-15",
      summary: "Estabelece diretrizes para o funcionamento da educação infantil na rede municipal.",
      fullDescription: "Dispõe sobre organização pedagógica, acolhimento, avaliação do desenvolvimento e parâmetros mínimos de funcionamento das unidades de educação infantil da rede municipal.",
      keywords: ["educação infantil", "rede municipal", "diretrizes", "creche"],
      active: true,
      featured: true
    }),
    buildSeed({
      title: "Resolução sobre Avaliação da Aprendizagem no Ensino Fundamental",
      documentType: "Resolução",
      category: byName("Avaliação"),
      administrativeSphere: "Estadual",
      lawOrDocumentNumber: "Resolução 45/2023",
      year: 2023,
      issuingBody: "Conselho Estadual de Educação",
      jurisdictionState: "MG",
      jurisdictionCity: "Belo Horizonte",
      publicationDate: "2023-08-10",
      summary: "Define critérios de avaliação diagnóstica, formativa e somativa no ensino fundamental.",
      fullDescription: "A norma regulamenta instrumentos avaliativos, recuperação paralela, acompanhamento da aprendizagem e critérios para registro escolar.",
      keywords: ["avaliação", "ensino fundamental", "aprendizagem", "resolução"],
      active: true,
      featured: false
    }),
    buildSeed({
      title: "Decreto de Organização do Calendário Escolar",
      documentType: "Decreto",
      category: byName("Gestão Escolar"),
      administrativeSphere: "Municipal",
      lawOrDocumentNumber: "Decreto 09/2025",
      year: 2025,
      issuingBody: "Prefeitura Municipal",
      jurisdictionState: "MG",
      jurisdictionCity: "Carbonita",
      publicationDate: "2025-01-12",
      summary: "Regulamenta a elaboração do calendário escolar anual e os dias letivos mínimos.",
      fullDescription: "Define procedimentos para elaboração, aprovação e revisão do calendário escolar, observando carga horária anual, recessos e eventos pedagógicos.",
      keywords: ["calendário escolar", "gestão", "dias letivos", "decreto"],
      active: true,
      featured: true
    }),
    buildSeed({
      title: "Portaria de Matrícula e Rematrícula na Rede Pública",
      documentType: "Portaria",
      category: byName("Normas Administrativas"),
      administrativeSphere: "Estadual",
      lawOrDocumentNumber: "Portaria 87/2024",
      year: 2024,
      issuingBody: "Secretaria de Estado da Educação",
      jurisdictionState: "MG",
      jurisdictionCity: "",
      publicationDate: "2024-10-02",
      summary: "Estabelece procedimentos para matrícula inicial, rematrícula e transferência de estudantes.",
      fullDescription: "Define documentação necessária, cronograma, critérios de zoneamento escolar e procedimentos para vagas remanescentes.",
      keywords: ["matrícula", "rematrícula", "transferência", "portaria"],
      active: true,
      featured: false
    }),
    buildSeed({
      title: "Parecer Técnico sobre Atendimento Educacional Especializado",
      documentType: "Parecer",
      category: byName("Educação Especial"),
      administrativeSphere: "Federal",
      lawOrDocumentNumber: "Parecer 11/2022",
      year: 2022,
      issuingBody: "Câmara de Educação Básica",
      jurisdictionState: "",
      jurisdictionCity: "",
      publicationDate: "2022-06-28",
      summary: "Orienta a oferta do atendimento educacional especializado em articulação com a sala regular.",
      fullDescription: "Apresenta fundamentos normativos para planejamento, registro e acompanhamento do atendimento educacional especializado, respeitando a inclusão e a equidade.",
      keywords: ["educação especial", "AEE", "inclusão", "parecer"],
      active: true,
      featured: false
    }),
    buildSeed({
      title: "Norma Complementar para Gestão Documental Escolar",
      documentType: "Norma",
      category: byName("Normas Administrativas"),
      administrativeSphere: "Municipal",
      lawOrDocumentNumber: "Norma 03/2025",
      year: 2025,
      issuingBody: "Secretaria Municipal de Educação",
      jurisdictionState: "MG",
      jurisdictionCity: "Carbonita",
      publicationDate: "2025-03-04",
      summary: "Regula a guarda, digitalização e atualização dos registros escolares.",
      fullDescription: "Dispõe sobre segurança da informação, prazos de arquivamento, expedição de históricos e padronização dos documentos administrativos das unidades escolares.",
      keywords: ["gestão documental", "arquivo", "histórico escolar", "norma"],
      active: true,
      featured: false
    }),
    buildSeed({
      title: "Instrução Normativa para Distribuição de Turmas",
      documentType: "Instrução Normativa",
      category: byName("Gestão Escolar"),
      administrativeSphere: "Municipal",
      lawOrDocumentNumber: "IN 06/2025",
      year: 2025,
      issuingBody: "Departamento Pedagógico Municipal",
      jurisdictionState: "MG",
      jurisdictionCity: "Carbonita",
      publicationDate: "2025-02-02",
      summary: "Estabelece critérios para formação de turmas e organização de turnos.",
      fullDescription: "Define quantitativos mínimos e máximos de estudantes por turma, critérios de inclusão e organização de atendimento em tempo parcial e integral.",
      keywords: ["turmas", "turnos", "organização escolar", "instrução normativa"],
      active: true,
      featured: false
    }),
    buildSeed({
      title: "Lei de Transparência e Publicidade dos Atos Educacionais",
      documentType: "Lei",
      category: byName("Legislação Geral"),
      administrativeSphere: "Federal",
      lawOrDocumentNumber: "Lei 998/2021",
      year: 2021,
      issuingBody: "Poder Legislativo",
      jurisdictionState: "",
      jurisdictionCity: "",
      publicationDate: "2021-11-19",
      summary: "Fortalece a transparência dos atos normativos relacionados à educação pública.",
      fullDescription: "Determina critérios para divulgação pública de normas, portarias e atos administrativos educacionais em portais oficiais, com linguagem acessível e mecanismos de pesquisa.",
      keywords: ["transparência", "atos educacionais", "publicidade", "lei"],
      active: true,
      featured: true
    }),
    buildSeed({
      title: "Resolução sobre Conselho Escolar e Participação da Comunidade",
      documentType: "Resolução",
      category: byName("Gestão Escolar"),
      administrativeSphere: "Municipal",
      lawOrDocumentNumber: "Resolução 12/2024",
      year: 2024,
      issuingBody: "Conselho Municipal de Educação",
      jurisdictionState: "MG",
      jurisdictionCity: "Carbonita",
      publicationDate: "2024-05-10",
      summary: "Organiza o funcionamento do conselho escolar e seus mecanismos de deliberação.",
      fullDescription: "Estabelece critérios de representação, periodicidade das reuniões, publicidade das decisões e participação da comunidade escolar.",
      keywords: ["conselho escolar", "participação", "gestão democrática"],
      active: true,
      featured: false
    }),
    buildSeed({
      title: "Portaria de Registro e Emissão de Histórico Escolar",
      documentType: "Portaria",
      category: byName("Normas Administrativas"),
      administrativeSphere: "Municipal",
      lawOrDocumentNumber: "Portaria 19/2023",
      year: 2023,
      issuingBody: "Secretaria Municipal de Educação",
      jurisdictionState: "MG",
      jurisdictionCity: "Carbonita",
      publicationDate: "2023-04-03",
      summary: "Padroniza procedimentos para emissão de históricos e declarações escolares.",
      fullDescription: "Define requisitos, fluxo interno, modelo documental e prazos para entrega de históricos, declarações e certidões escolares.",
      keywords: ["histórico escolar", "declaração", "registro escolar"],
      active: true,
      featured: false
    })
  ];
}

function buildSeed(data) {
  return {
    id: uid(),
    title: data.title,
    slug: slugify(data.title),
    protocol: generateProtocol(),
    documentType: data.documentType,
    categoryId: data.category.id,
    categoryName: data.category.name,
    administrativeSphere: data.administrativeSphere,
    lawOrDocumentNumber: data.lawOrDocumentNumber,
    year: data.year,
    issuingBody: data.issuingBody,
    jurisdictionState: data.jurisdictionState,
    jurisdictionCity: data.jurisdictionCity,
    publicationDate: data.publicationDate,
    summary: data.summary,
    fullDescription: data.fullDescription,
    keywords: data.keywords,
    pdfUrl: "",
    coverImageData: "",
    active: data.active,
    featured: data.featured,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function groupCounts(list, key) {
  const map = new Map();
  list.forEach(item => {
    const label = item[key] || "Não informado";
    map.set(label, (map.get(label) || 0) + 1);
  });
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function formatCpf(value) {
  const digits = normalizeCpf(value);
  if (digits.length !== 11) return String(value || "").trim();
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function normalizeCpf(value) {
  return String(value || "").replace(/\D/g, "");
}

function statCard(label, value) {
  return `
    <article class="stat-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(String(value))}</strong>
    </article>
  `;
}

function splitKeywords(value) {
  return value
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
}

function slugify(text) {
  return normalizeText(text)
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function normalizeText(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function formatDate(dateString) {
  if (!dateString) return "-";
  const [y, m, d] = String(dateString).split("-");
  return `${d}/${m}/${y}`;
}

function formatDateTime(dateString) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("pt-BR");
}

function uniqueValues(array) {
  return [...new Set(array.filter(Boolean))];
}

function uid() {
  if (window.crypto?.randomUUID) return crypto.randomUUID();
  return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function limitText(text, max) {
  const value = String(text || "");
  if (value.length <= max) return value;
  return value.slice(0, max).trim() + "...";
}

function coverStyle(dataUrl) {
  return dataUrl ? `background-image:url("${dataUrl}")` : "";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.remove("hidden");
  toastTimer = setTimeout(() => {
    els.toast.classList.add("hidden");
  }, 2600);
  
}
