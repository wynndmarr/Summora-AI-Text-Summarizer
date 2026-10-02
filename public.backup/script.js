const authModal = document.getElementById("authModal");
const authButton = document.getElementById("authButton");
const closeAuthModal = document.getElementById("closeAuthModal");

const loginView = document.getElementById("loginView");
const registerView = document.getElementById("registerView");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const showRegister = document.getElementById("showRegister");
const showLogin = document.getElementById("showLogin");

const loginMessage = document.getElementById("loginMessage");
const registerMessage = document.getElementById("registerMessage");

const authStatus = document.getElementById("authStatus");
const authStatusText = document.getElementById("authStatusText");

let currentUser = null;


function openAuthModal(view = "login") {
    if (!authModal) return;

    authModal.classList.remove("hidden");

    if (loginMessage) {
        loginMessage.textContent = "";
    }

    if (registerMessage) {
        registerMessage.textContent = "";
    }

    if (view === "register") {
        loginView?.classList.add("hidden");
        registerView?.classList.remove("hidden");
    } else {
        registerView?.classList.add("hidden");
        loginView?.classList.remove("hidden");
    }
}

function closeModal() {
    authModal?.classList.add("hidden");
}


document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("textarea").forEach((el) => {
        el.setAttribute("spellcheck", "false");
    });

    document.querySelectorAll('input[type="text"]').forEach((el) => {
        el.setAttribute("spellcheck", "false");
    });
});


if (authButton) {
    authButton.addEventListener("click", () => {
        if (currentUser) {
            logout();
        } else {
            openAuthModal("login");
        }
    });
}

if (closeAuthModal) {
    closeAuthModal.addEventListener("click", closeModal);
}

if (showRegister) {
    showRegister.addEventListener("click", () => {
        openAuthModal("register");
    });
}

if (showLogin) {
    showLogin.addEventListener("click", () => {
        openAuthModal("login");
    });
}

if (authModal) {
    authModal.addEventListener("click", (event) => {
        if (event.target === authModal) {
            closeModal();
        }
    });
}


async function checkLogin() {
    try {
        const response = await fetch("/api/me", {
            method: "GET",
            credentials: "include"
        });

        const result = await response.json();

        if (
            result.success &&
            result.loggedIn &&
            result.data
        ) {
            currentUser = result.data;

            updateAuthUI();
            loadHistory();
        } else {
            currentUser = null;
            updateAuthUI();
        }
    } catch (error) {
        console.error("Check login error:", error);

        currentUser = null;
        updateAuthUI();
    }
}
function updateAuthUI() {
    if (!authButton || !authStatusText) {
        return;
    }

    const statusDot =
        authStatus?.querySelector(".status-dot");

    if (currentUser) {
        if (statusDot) {
            statusDot.classList.remove("offline");
            statusDot.classList.add("online");
        }

        if (authStatus) {
            authStatus.classList.remove("unauthenticated");
            authStatus.classList.add("authenticated");
        }

        authStatusText.textContent =
            `Hi, ${currentUser.name}`;

        authButton.textContent = "Logout";
    } else {
        if (statusDot) {
            statusDot.classList.remove("online");
            statusDot.classList.add("offline");
        }

        if (authStatus) {
            authStatus.classList.remove("authenticated");
            authStatus.classList.add("unauthenticated");
        }

        authStatusText.textContent = "Belum login";
        authButton.textContent = "Login";
    }
}


if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const emailInput =
            document.getElementById("loginEmail");

        const passwordInput =
            document.getElementById("loginPassword");

        const email =
            emailInput?.value.trim() || "";

        const password =
            passwordInput?.value || "";

        if (loginMessage) {
            loginMessage.textContent =
                "Memproses login...";
        }

        try {
            const response = await fetch(
                "/api/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            const result =
                await response.json();

            if (
                !response.ok ||
                !result.success
            ) {
                if (loginMessage) {
                    loginMessage.textContent =
                        result.message ||
                        "Login gagal.";
                }

                return;
            }

            currentUser = result.data;

            updateAuthUI();

            if (loginMessage) {
                loginMessage.textContent =
                    "Login berhasil!";
            }

            setTimeout(() => {
                closeModal();
                loginForm.reset();
                loadHistory();
            }, 500);

        } catch (error) {
            console.error("Login error:", error);

            if (loginMessage) {
                loginMessage.textContent =
                    "Tidak dapat terhubung ke server.";
            }
        }
    });
}

if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const nameInput =
            document.getElementById("registerName");

        const emailInput =
            document.getElementById("registerEmail");

        const passwordInput =
            document.getElementById("registerPassword");

        const name =
            nameInput?.value.trim() || "";

        const email =
            emailInput?.value.trim() || "";

        const password =
            passwordInput?.value || "";

        if (registerMessage) {
            registerMessage.textContent =
                "Membuat akun...";
        }

        try {
            const response = await fetch(
                "/api/register",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        name,
                        email,
                        password
                    })
                }
            );

            const result =
                await response.json();

            if (
                !response.ok ||
                !result.success
            ) {
                if (registerMessage) {
                    registerMessage.textContent =
                        result.message ||
                        "Registrasi gagal.";
                }

                return;
            }

            if (registerMessage) {
                registerMessage.textContent =
                    "Registrasi berhasil! Silakan login.";
            }

            registerForm.reset();

            setTimeout(() => {
                openAuthModal("login");

                const loginEmail =
                    document.getElementById(
                        "loginEmail"
                    );

                if (loginEmail) {
                    loginEmail.value = email;
                }
            }, 800);

        } catch (error) {
            console.error(
                "Register error:",
                error
            );

            if (registerMessage) {
                registerMessage.textContent =
                    "Tidak dapat terhubung ke server.";
            }
        }
    });
}


async function logout() {
    try {
        const response = await fetch(
            "/api/logout",
            {
                method: "POST",
                credentials: "include"
            }
        );

        const result =
            await response.json();

        if (
            !response.ok ||
            !result.success
        ) {
            throw new Error(
                result.message ||
                "Gagal logout."
            );
        }

        currentUser = null;

        updateAuthUI();

        if (resultSection) {
            resultSection.classList.add("hidden");
        }

        if (mainIdea) {
            mainIdea.textContent = "-";
        }

        if (summaryPoints) {
            summaryPoints.innerHTML = "";
        }

        if (historyContainer) {
            historyContainer.innerHTML = `
                <div class="empty-history">
                    Belum ada riwayat rangkuman.
                    Buat rangkuman pertama Anda di atas.
                </div>
            `;
        }

        showToast(
            "Anda berhasil logout.",
            "Berhasil"
        );

    } catch (error) {
        console.error(
            "Logout error:",
            error
        );

        showToast(
            error.message ||
            "Gagal logout.",
            "Gagal"
        );
    }
}

const textInput =
    document.getElementById("textInput");

const characterCount =
    document.getElementById("characterCount");

const summarizeButton =
    document.getElementById("summarizeButton");

const buttonText =
    document.getElementById("buttonText");

const buttonIcon =
    document.getElementById("buttonIcon");

const resultSection =
    document.getElementById("resultSection");

const mainIdea =
    document.getElementById("mainIdea");

const summaryPoints =
    document.getElementById("summaryPoints");

const historyContainer =
    document.getElementById("historyContainer");

const refreshHistory =
    document.getElementById("refreshHistory");


if (textInput && characterCount) {
    textInput.addEventListener("input", () => {
        const length =
            textInput.value.length;

        characterCount.textContent =
            `${length.toLocaleString("id-ID")} / 100.000`;
    });
}

if (summarizeButton) {
    summarizeButton.addEventListener(
        "click",
        summarizeText
    );
}

const MIN_SUMMARY_WORDS = 50;

function validateSummaryText(text) {
    const cleanedText =
        text.trim();

    if (!cleanedText) {
        return {
            valid: false,
            message:
                "Silakan masukkan teks terlebih dahulu."
        };
    }

    if (!/[\p{L}]/u.test(cleanedText)) {
        return {
            valid: false,
            message:
                "Teks yang dimasukkan belum valid. Silakan masukkan kalimat atau paragraf yang memiliki kata bermakna."
        };
    }

    const words =
        cleanedText.match(/[\p{L}\p{N}]+/gu) || [];

    const wordCount =
        words.length;

    if (wordCount < MIN_SUMMARY_WORDS) {
        return {
            valid: false,
            message:
                `Teks masih terlalu singkat. Silakan masukkan minimal ${MIN_SUMMARY_WORDS} kata agar dapat dirangkum dengan baik.`
        };
    }

    return {
        valid: true,
        wordCount
    };
}

function clearSummaryResult() {
    if (resultSection) {
        resultSection.classList.add("hidden");
    }

    if (mainIdea) {
        mainIdea.textContent = "-";
    }

    if (summaryPoints) {
        summaryPoints.innerHTML = "";
    }
}

async function summarizeText() {

    if (!currentUser) {
        openAuthModal("login");
        return;
    }

    if (!textInput) {
        return;
    }

    const text =
        textInput.value.trim();

    clearSummaryResult();

    const validation =
        validateSummaryText(text);

    if (!validation.valid) {
        showToast(
            validation.message,
            "Peringatan"
        );

        textInput.focus();

        return;
    }

    setLoading(true);

    try {
        const response =
            await fetch(
                "/api/summarize",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        text
                    })
                }
            );

        const result =
            await response.json();

        if (
            !response.ok ||
            !result.success
        ) {
            throw new Error(
                result.message ||
                "Gagal membuat rangkuman."
            );
        }

        displaySummary(result.data);

        await loadHistory();

    } catch (error) {
        console.error(
            "Summarize error:",
            error
        );

        clearSummaryResult();

        showToast(
            error.message ||
            "Terjadi kesalahan saat membuat rangkuman.",
            "Gagal"
        );

    } finally {
        setLoading(false);
    }
}

function displaySummary(data) {
    if (!data) {
        return;
    }

    if (mainIdea) {
        mainIdea.textContent =
            data.main_idea || "-";
    }

    if (summaryPoints) {
        summaryPoints.innerHTML = "";

        if (
            Array.isArray(
                data.summary_points
            )
        ) {
            data.summary_points.forEach(
                (point) => {
                    const li =
                        document.createElement("li");

                    li.textContent =
                        point;

                    summaryPoints.appendChild(li);
                }
            );
        }
    }

    if (resultSection) {
        resultSection.classList.remove("hidden");

        setTimeout(() => {
            resultSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }, 100);
    }
}

function setLoading(isLoading) {
    if (!summarizeButton) {
        return;
    }

    summarizeButton.disabled =
        isLoading;

    if (isLoading) {
        if (buttonText) {
            buttonText.textContent =
                "Menganalisis...";
        }

        if (buttonIcon) {
            buttonIcon.innerHTML =
                '<span class="spinner"></span>';
        }

    } else {
        if (buttonText) {
            buttonText.textContent =
                "Rangkum Teks";
        }

        if (buttonIcon) {
            buttonIcon.textContent =
                "✦";
        }
    }
}
async function loadHistory() {
    if (
        !currentUser ||
        !historyContainer
    ) {
        return;
    }

    try {
        historyContainer.innerHTML = `
            <div class="loading-history">
                Memuat riwayat...
            </div>
        `;

        const response =
            await fetch(
                "/api/summaries",
                {
                    method: "GET",
                    credentials: "include"
                }
            );

        const result =
            await response.json();

        if (
            !response.ok ||
            !result.success
        ) {
            throw new Error(
                result.message ||
                "Gagal mengambil riwayat."
            );
        }

        const items =
            Array.isArray(result.data)
                ? result.data
                : [];

        renderHistory(items);

    } catch (error) {
        console.error(
            "History error:",
            error
        );

        historyContainer.innerHTML = `
            <div class="empty-history">
                Gagal memuat riwayat rangkuman.
            </div>
        `;
    }
}


function renderHistory(items) {
    if (!historyContainer) {
        return;
    }

    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {
        historyContainer.innerHTML = `
            <div class="empty-history">
                Belum ada riwayat rangkuman.
                Buat rangkuman pertama Anda di atas.
            </div>
        `;

        return;
    }

    historyContainer.innerHTML = "";

    items.forEach((item) => {

        const card =
            document.createElement("article");

        card.className =
            "history-card";

        const date =
            formatDate(item.created_at);

        const preview =
            item.original_text || "";
        let points = [];

        try {
            if (
                Array.isArray(
                    item.summary_points
                )
            ) {
                points =
                    item.summary_points;
            } else if (
                typeof item.summary_points ===
                "string"
            ) {
                const parsed =
                    JSON.parse(
                        item.summary_points
                    );

                if (Array.isArray(parsed)) {
                    points = parsed;
                }
            }
        } catch (error) {
            console.error(
                "Gagal membaca summary_points:",
                error
            );

            points = [];
        }
        card.innerHTML = `
            <div class="history-card-header">

                <div class="history-date">
                    ${escapeHTML(date)}
                </div>

                <div class="history-main-idea">
                    ${escapeHTML(
                        item.main_idea || ""
                    )}
                </div>

                <div class="history-preview">
                    ${escapeHTML(preview)}
                </div>

                <div class="history-expand-indicator">
                    <span>
                        Lihat poin penting
                    </span>

                    <span class="history-chevron">
                        ⌄
                    </span>
                </div>

            </div>

            <div class="history-details">

                <div class="history-details-inner">

                    <div class="history-details-title">
                        <span>✦</span>

                        <span>
                            Poin-poin Penting
                        </span>
                    </div>

                    <ul class="history-points">
                        ${
                            points.length > 0
                                ? points
                                    .map(
                                        (point) => `
                                            <li>
                                                ${escapeHTML(
                                                    point
                                                )}
                                            </li>
                                        `
                                    )
                                    .join("")
                                : `
                                    <li>
                                        Tidak ada poin penting.
                                    </li>
                                `
                        }
                    </ul>

                    <div class="history-actions">

                        <button
                            type="button"
                            class="delete-button"
                            data-id="${escapeHTML(item.id)}"
                        >
                            Hapus
                        </button>

                        <button
                            type="button"
                            class="history-copy-button"
                        >
                            <span>⧉</span>
                            <span>Salin</span>
                        </button>

                    </div>

                </div>

            </div>
        `;
        const header =
            card.querySelector(
                ".history-card-header"
            );

        if (header) {
            header.addEventListener(
                "click",
                () => {
                    card.classList.toggle(
                        "expanded"
                    );
                }
            );
        }
        const deleteButton =
            card.querySelector(
                ".delete-button"
            );

        if (deleteButton) {
            deleteButton.addEventListener(
                "click",
                (event) => {
                    event.stopPropagation();

                    deleteSummary(
                        item.id
                    );
                }
            );
        }


        const copyButton =
            card.querySelector(
                ".history-copy-button"
            );

        if (copyButton) {

            copyButton.addEventListener(
                "click",
                async (event) => {

                    event.stopPropagation();

                    const mainIdeaText =
                        (
                            item.main_idea ||
                            ""
                        ).trim();

                    const summaryPointTexts =
                        Array.isArray(points)
                            ? points
                                .map(
                                    (point) =>
                                        String(
                                            point
                                        ).trim()
                                )
                                .filter(Boolean)
                            : [];

                    const textToCopy =
                        [
                            mainIdeaText,
                            "",
                            ...summaryPointTexts.map(
                                (point) =>
                                    `- ${point}`
                            )
                        ]
                            .join("\n")
                            .trim();

                    if (!textToCopy) {
                        return;
                    }

                    try {

                        if (
                            navigator.clipboard &&
                            window.isSecureContext
                        ) {
                            await navigator.clipboard.writeText(
                                textToCopy
                            );
                        } else {
                            throw new Error(
                                "Clipboard API tidak tersedia."
                            );
                        }

                        showCopySuccess(copyButton);

                    } catch (error) {

                        console.warn(
                            "Clipboard API gagal, menggunakan fallback.",
                            error
                        );

                        const textarea =
                            document.createElement(
                                "textarea"
                            );

                        textarea.value =
                            textToCopy;

                        textarea.style.position =
                            "fixed";

                        textarea.style.left =
                            "-9999px";

                        textarea.style.top =
                            "0";

                        document.body.appendChild(
                            textarea
                        );

                        textarea.focus();
                        textarea.select();

                        try {

                            const copied =
                                document.execCommand(
                                    "copy"
                                );

                            if (copied) {
                                showCopySuccess(
                                    copyButton
                                );
                            }

                        } catch (fallbackError) {

                            console.error(
                                "Fallback copy gagal:",
                                fallbackError
                            );

                        } finally {
                            textarea.remove();
                        }
                    }
                }
            );
        }

        historyContainer.appendChild(card);
    });
}
function showCopySuccess(button) {
    if (!button) {
        return;
    }

    button.innerHTML = `
        <span>✓</span>
        <span>Tersalin</span>
    `;

    button.classList.add("copied");

    setTimeout(() => {
        button.innerHTML = `
            <span>⧉</span>
            <span>Salin</span>
        `;

        button.classList.remove("copied");
    }, 1500);
}

function showConfirmModal(
    message,
    onConfirm
) {
    const modal =
        document.getElementById(
            "confirmModal"
        );

    const confirmMessage =
        document.getElementById(
            "confirmMessage"
        );

    const cancelButton =
        document.getElementById(
            "confirmCancel"
        );

    const deleteButton =
        document.getElementById(
            "confirmDelete"
        );

    if (
        !modal ||
        !cancelButton ||
        !deleteButton
    ) {
        return;
    }

    if (confirmMessage) {
        confirmMessage.textContent =
            message;
    }

    modal.classList.remove("hidden");

    const closeConfirm =
        () => {
            modal.classList.add("hidden");

            cancelButton.onclick = null;
            deleteButton.onclick = null;
        };

    cancelButton.onclick =
        () => {
            closeConfirm();
        };

    deleteButton.onclick =
        async () => {
            closeConfirm();

            await onConfirm();
        };
}
async function deleteSummary(id) {
    showConfirmModal(
        "Hapus riwayat rangkuman ini?",
        async () => {
            try {

                const response =
                    await fetch(
                        `/api/summaries/${id}`,
                        {
                            method: "DELETE",
                            credentials: "include"
                        }
                    );

                const result =
                    await response.json();

                if (
                    !response.ok ||
                    !result.success
                ) {
                    throw new Error(
                        result.message ||
                        "Gagal menghapus data."
                    );
                }

                await loadHistory();

                showToast(
                    "Riwayat rangkuman berhasil dihapus.",
                    "Berhasil"
                );

            } catch (error) {

                console.error(
                    "Delete history error:",
                    error
                );

                showToast(
                    error.message ||
                    "Gagal menghapus data.",
                    "Gagal"
                );
            }
        }
    );
}
const customToast =
    document.getElementById(
        "customToast"
    );

const toastTitle =
    document.getElementById(
        "toastTitle"
    );

const toastMessage =
    document.getElementById(
        "toastMessage"
    );

const toastIcon =
    document.getElementById(
        "toastIcon"
    );

const toastClose =
    document.getElementById(
        "toastClose"
    );

let toastTimer = null;


function showToast(
    message = "Teks masih terlalu singkat. Silakan masukkan minimal 50 kata agar dapat dirangkum dengan baik.",
    title = "Peringatan!",
    icon = "!"
) {
    if (!customToast) {
        return;
    }

    clearTimeout(toastTimer);

    if (toastTitle) {
        toastTitle.textContent =
            title;
    }

    if (toastMessage) {
        toastMessage.textContent =
            message;
    }

    if (toastIcon) {
        toastIcon.textContent =
            icon;
    }

    customToast.classList.add("show");

    toastTimer =
        setTimeout(() => {
            hideToast();
        }, 4500);
}


function hideToast() {
    if (!customToast) {
        return;
    }

    customToast.classList.remove("show");

    clearTimeout(toastTimer);
}


if (toastClose) {
    toastClose.addEventListener(
        "click",
        hideToast
    );
}


function formatDate(dateString) {
    if (!dateString) {
        return "-";
    }

    const date =
        new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleString(
        "id-ID",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );
}

function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
if (refreshHistory) {
    refreshHistory.addEventListener(
        "click",
        loadHistory
    );
}

document.addEventListener(
    "DOMContentLoaded",
    () => {
        checkLogin();
    }
);
(function initSummoraTheme() {

    const STORAGE_KEY =
        "summora-theme";

    function applyTheme(theme) {
        document.documentElement.setAttribute(
            "data-theme",
            theme
        );
    }

    function updateThemeIcon(button) {
        if (!button) {
            return;
        }

        const currentTheme =
            document.documentElement.getAttribute(
                "data-theme"
            );

        if (currentTheme === "dark") {

            button.textContent = "☀";

            button.setAttribute(
                "aria-label",
                "Aktifkan Light Mode"
            );

            button.setAttribute(
                "title",
                "Light Mode"
            );

        } else {

            button.textContent = "☾";

            button.setAttribute(
                "aria-label",
                "Aktifkan Dark Mode"
            );

            button.setAttribute(
                "title",
                "Dark Mode"
            );
        }
    }

    function createThemeToggle() {

        const navAuth =
            document.querySelector(
                ".nav-auth"
            );

        if (!navAuth) {
            return;
        }

        let themeButton =
            document.getElementById(
                "themeToggle"
            );

        if (!themeButton) {

            themeButton =
                document.createElement(
                    "button"
                );

            themeButton.type =
                "button";

            themeButton.id =
                "themeToggle";

            themeButton.className =
                "theme-toggle";

            themeButton.setAttribute(
                "aria-label",
                "Ganti tema"
            );

            themeButton.setAttribute(
                "title",
                "Ganti tema"
            );

            navAuth.prepend(
                themeButton
            );

            themeButton.addEventListener(
                "click",
                () => {

                    const currentTheme =
                        document.documentElement.getAttribute(
                            "data-theme"
                        );

                    const nextTheme =
                        currentTheme === "dark"
                            ? "light"
                            : "dark";

                    applyTheme(
                        nextTheme
                    );

                    localStorage.setItem(
                        STORAGE_KEY,
                        nextTheme
                    );

                    updateThemeIcon(
                        themeButton
                    );
                }
            );
        }

        updateThemeIcon(
            themeButton
        );
    }


    const savedTheme =
        localStorage.getItem(
            STORAGE_KEY
        );

    const systemPrefersDark =
        window.matchMedia &&
        window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches;

    const initialTheme =
        savedTheme ||
        (systemPrefersDark
            ? "dark"
            : "light");

    applyTheme(
        initialTheme
    );


    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            createThemeToggle,
            {
                once: true
            }
        );
    } else {
        createThemeToggle();
    }

})();
if (typeof textInput !== "undefined" && typeof summarizeButton !== "undefined") {
    textInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            summarizeButton.click();
        }
    });
}