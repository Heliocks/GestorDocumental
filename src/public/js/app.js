(function () {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const openButton = document.getElementById('sidebarToggle');
  const closeButton = document.getElementById('sidebarClose');

  function openSidebar() {
    if (!sidebar || !overlay) return;
    sidebar.classList.remove('-translate-x-full');
    overlay.classList.remove('hidden');
  }

  function closeSidebar() {
    if (!sidebar || !overlay) return;
    sidebar.classList.add('-translate-x-full');
    overlay.classList.add('hidden');
  }

  if (openButton) openButton.addEventListener('click', openSidebar);
  if (closeButton) closeButton.addEventListener('click', closeSidebar);
  if (overlay) overlay.addEventListener('click', closeSidebar);

  const ownerModal = document.getElementById('ownerPickerModal');
  const ownerOpenButton = document.getElementById('ownerPickerOpen');
  const ownerAcceptButton = document.getElementById('ownerPickerAccept');
  const ownerCancelButton = document.getElementById('ownerPickerCancel');
  const ownerCancelTopButton = document.getElementById('ownerPickerCancelTop');
  const ownerBackdrop = document.getElementById('ownerPickerBackdrop');
  const ownerInput = document.getElementById('owner_user_id');
  const ownerDisplay = document.getElementById('ownerPickerDisplay');
  const ownerDepartmentFilter = document.getElementById('ownerDepartmentFilter');
  const ownerCompanyFilter = document.getElementById('ownerCompanyFilter');
  const ownerEmpty = document.getElementById('ownerPickerEmpty');
  const visibleModal = document.getElementById('visiblePickerModal');
  const visibleOpenButton = document.getElementById('visiblePickerOpen');
  const visibleAcceptButton = document.getElementById('visiblePickerAccept');
  const visibleCancelButton = document.getElementById('visiblePickerCancel');
  const visibleCancelTopButton = document.getElementById('visiblePickerCancelTop');
  const visibleBackdrop = document.getElementById('visiblePickerBackdrop');
  const visibleInput = document.getElementById('visible_user_ids');
  const visibleDisplay = document.getElementById('visiblePickerDisplay');
  const visibleNames = document.getElementById('visiblePickerNames');
  const visibleDepartmentFilter = document.getElementById('visibleDepartmentFilter');
  const visibleCompanyFilter = document.getElementById('visibleCompanyFilter');
  const visibleEmpty = document.getElementById('visiblePickerEmpty');

  function isOptionVisible(input) {
    const option = input ? input.closest('label') : null;
    return !option || !option.classList.contains('hidden');
  }

  function applyUserPickerFilters(modal, optionSelector, departmentFilter, companyFilter, emptyElement) {
    if (!modal) return;

    const departmentId = departmentFilter ? departmentFilter.value : '';
    const companyId = companyFilter ? companyFilter.value : '';
    const options = Array.from(modal.querySelectorAll(optionSelector));
    let visibleCount = 0;

    options.forEach(function (option) {
      const matchesDepartment = !departmentId || option.dataset.departmentId === departmentId;
      const matchesCompany = !companyId || option.dataset.companyId === companyId;
      const matches = matchesDepartment && matchesCompany;

      option.classList.toggle('hidden', !matches);
      if (matches) visibleCount += 1;
    });

    if (emptyElement) {
      emptyElement.classList.toggle('hidden', visibleCount > 0);
    }
  }

  function applyOwnerFilters() {
    applyUserPickerFilters(
      ownerModal,
      '[data-owner-option]',
      ownerDepartmentFilter,
      ownerCompanyFilter,
      ownerEmpty
    );
  }

  function applyVisibleFilters() {
    applyUserPickerFilters(
      visibleModal,
      '[data-visible-option]',
      visibleDepartmentFilter,
      visibleCompanyFilter,
      visibleEmpty
    );
  }

  function openOwnerModal() {
    if (!ownerModal) return;
    applyOwnerFilters();
    ownerModal.classList.remove('hidden');
    ownerModal.setAttribute('aria-hidden', 'false');

    const selectedRadio = ownerModal.querySelector('input[name="owner_candidate_id"]:checked');
    const firstRadio = ownerModal.querySelector('input[name="owner_candidate_id"]');
    const focusTarget = isOptionVisible(selectedRadio) ? selectedRadio : Array.from(ownerModal.querySelectorAll('input[name="owner_candidate_id"]')).find(isOptionVisible) || firstRadio || ownerAcceptButton;

    if (focusTarget) focusTarget.focus();
  }

  function closeOwnerModal() {
    if (!ownerModal) return;
    ownerModal.classList.add('hidden');
    ownerModal.setAttribute('aria-hidden', 'true');
    if (ownerOpenButton) ownerOpenButton.focus();
  }

  function acceptOwnerSelection() {
    if (!ownerModal || !ownerInput || !ownerDisplay) return;

    const selectedRadio = ownerModal.querySelector('input[name="owner_candidate_id"]:checked');

    if (!selectedRadio) {
      return;
    }

    ownerInput.value = selectedRadio.value;
    ownerDisplay.textContent = selectedRadio.dataset.ownerLabel || 'Dueño seleccionado';
    ownerDisplay.classList.remove('text-slate-500', 'font-medium');
    ownerDisplay.classList.add('text-slate-900', 'font-semibold');
    closeOwnerModal();
  }

  function openVisibleModal() {
    if (!visibleModal) return;
    applyVisibleFilters();
    visibleModal.classList.remove('hidden');
    visibleModal.setAttribute('aria-hidden', 'false');

    const firstCheckbox = visibleModal.querySelector('[data-visible-candidate]');
    const checkedCheckbox = visibleModal.querySelector('[data-visible-candidate]:checked');
    const focusTarget = isOptionVisible(checkedCheckbox) ? checkedCheckbox : Array.from(visibleModal.querySelectorAll('[data-visible-candidate]')).find(isOptionVisible) || firstCheckbox || visibleAcceptButton;

    if (focusTarget) focusTarget.focus();
  }

  function closeVisibleModal() {
    if (!visibleModal) return;
    visibleModal.classList.add('hidden');
    visibleModal.setAttribute('aria-hidden', 'true');
    if (visibleOpenButton) visibleOpenButton.focus();
  }

  function acceptVisibleSelection() {
    if (!visibleModal || !visibleInput || !visibleDisplay || !visibleNames) return;

    const selectedCheckboxes = Array.from(visibleModal.querySelectorAll('[data-visible-candidate]:checked'));
    const values = selectedCheckboxes.map(function (checkbox) {
      return checkbox.value;
    });
    const labels = selectedCheckboxes.map(function (checkbox) {
      return checkbox.dataset.visibleLabel || checkbox.value;
    });

    visibleInput.value = values.join(',');

    if (values.length) {
      visibleDisplay.textContent = values.length + ' usuario(s) seleccionado(s)';
      visibleNames.textContent = labels.join(', ');
      visibleDisplay.classList.remove('text-slate-500', 'font-medium');
      visibleDisplay.classList.add('text-slate-900', 'font-semibold');
    } else {
      visibleDisplay.textContent = 'Sin usuarios seleccionados';
      visibleNames.textContent = 'Selecciona los usuarios que podran ver el documento.';
      visibleDisplay.classList.remove('text-slate-900', 'font-semibold');
      visibleDisplay.classList.add('text-slate-500', 'font-medium');
    }

    closeVisibleModal();
  }

  if (ownerOpenButton) ownerOpenButton.addEventListener('click', openOwnerModal);
  if (ownerAcceptButton) ownerAcceptButton.addEventListener('click', acceptOwnerSelection);
  if (ownerCancelButton) ownerCancelButton.addEventListener('click', closeOwnerModal);
  if (ownerCancelTopButton) ownerCancelTopButton.addEventListener('click', closeOwnerModal);
  if (ownerBackdrop) ownerBackdrop.addEventListener('click', closeOwnerModal);
  if (ownerDepartmentFilter) ownerDepartmentFilter.addEventListener('change', applyOwnerFilters);
  if (ownerCompanyFilter) ownerCompanyFilter.addEventListener('change', applyOwnerFilters);
  if (visibleOpenButton) visibleOpenButton.addEventListener('click', openVisibleModal);
  if (visibleAcceptButton) visibleAcceptButton.addEventListener('click', acceptVisibleSelection);
  if (visibleCancelButton) visibleCancelButton.addEventListener('click', closeVisibleModal);
  if (visibleCancelTopButton) visibleCancelTopButton.addEventListener('click', closeVisibleModal);
  if (visibleBackdrop) visibleBackdrop.addEventListener('click', closeVisibleModal);
  if (visibleDepartmentFilter) visibleDepartmentFilter.addEventListener('change', applyVisibleFilters);
  if (visibleCompanyFilter) visibleCompanyFilter.addEventListener('change', applyVisibleFilters);

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && visibleModal && !visibleModal.classList.contains('hidden')) {
      closeVisibleModal();
    } else if (event.key === 'Escape' && ownerModal && !ownerModal.classList.contains('hidden')) {
      closeOwnerModal();
    }
  });

  document.addEventListener('submit', function (event) {
    const form = event.target;
    const message = form.dataset ? form.dataset.confirm : null;

    if (message && !window.confirm(message)) {
      event.preventDefault();
    }
  });
})();
