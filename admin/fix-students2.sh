#!/usr/bin/env bash
set -euo pipefail

FILE="$HOME/gmp-portal/admin/students2.html"
TMP="$(mktemp)"
cp "$FILE" "$TMP"

perl -0777 -pi -e '
  s|</body>\s*</html>|<script>
document.addEventListener("DOMContentLoaded", function() {
  try {
    if (!window.studentsManager && typeof StudentsManager === "function") {
      window.studentsManager = new StudentsManager();
    }

    const bind = (id, fn) => {
      const el = document.getElementById(id);
      if (el && typeof fn === "function") el.onclick = fn;
    };

    bind("exportBtn", () => studentsManager.exportStudents());
    bind("importBtn", () => studentsManager.importStudents && studentsManager.importStudents());
    bind("addStudentBtn", () => studentsManager.showAddStudentModal && studentsManager.showAddStudentModal());
    bind("saveStudentBtn", () => studentsManager.saveStudent && studentsManager.saveStudent());
    bind("editFromViewBtn", () => studentsManager.editFromView && studentsManager.editFromView());
    bind("saveSettingsBtn", () => studentsManager.saveSettings && studentsManager.saveSettings());

    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      let t; searchInput.addEventListener("input", e => {
        clearTimeout(t); t = setTimeout(() => {
          studentsManager.searchTerm = e.target.value;
          studentsManager.currentPage = 1;
          studentsManager.loadStudents();
        }, 400);
      });
    }

    const searchInputTable = document.getElementById("searchInputTable");
    if (searchInputTable) {
      let t; searchInputTable.addEventListener("input", e => {
        clearTimeout(t); t = setTimeout(() => {
          studentsManager.searchTerm = e.target.value;
          studentsManager.currentPage = 1;
          studentsManager.loadStudents();
        }, 400);
      });
    }

    const statusFilter = document.getElementById("statusFilter");
    if (statusFilter) {
      statusFilter.addEventListener("change", e => {
        studentsManager.statusFilter = e.target.value;
        studentsManager.currentPage = 1;
        studentsManager.loadStudents();
      });
    }

    const levelFilter = document.getElementById("levelFilter");
    if (levelFilter) {
      levelFilter.addEventListener("change", e => {
        studentsManager.levelFilter = e.target.value;
        studentsManager.currentPage = 1;
        studentsManager.loadStudents();
      });
    }
  } catch(e) {
    console.error("students2 wiring error:", e);
  }
});
</script>
</body></html>|g' "$TMP"

mv "$TMP" "$FILE"
echo "students2.html corrigido com wiring funcional e inicialização garantida."
