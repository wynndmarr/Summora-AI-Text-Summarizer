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
const otpMessage = document.getElementById("otpMessage");
const resendOtpButton = document.getElementById("resendOtpButton");
const otpInput = document.getElementById("otpInput");
const verificationEmailLabel = document.getElementById("verificationEmail");

const authStatus = document.getElementById("authStatus");
const authStatusText = document.getElementById("authStatusText");

let currentUser = null;
let verificationEmail = "";
let resendCooldownUntil = 0;
let resendCountdownTimer = null;


function openAuthModal(view = "login") {
    if (!authModal) return;

    authModal.classList.remove("hidden");

    if (loginMessage) {
        loginMessage.textContent = "";
    }

    if (registerMessage) {
        registerMessage.textContent = "";
    }

    if (otpMessage) {
        otpMessage.textContent = "";
    }

    if (view === "register") {
        loginView?.classList.add("hidden");
        registerView?.classList.remove("hidden");
        document.getElementById("verificationView")?.classList.add("hidden");
    } else if (view === "verify") {
        loginView?.classList.add("hidden");
        registerView?.classList.add("hidden");
        document.getElementById("verificationView")?.classList.remove("hidden");
    } else {
        registerView?.classList.add("hidden");
        document.getElementById("verificationView")?.classList.add("hidden");
        loginView?.classList.remove("hidden");
    }
}

function startResendCooldown(seconds = 0) {
    clearInterval(resendCountdownTimer);
    resendCooldownUntil =
        Date.now() + Math.max(0, Number(seconds) || 0) * 1000;

    const updateCountdown = () => {
        const remaining =
            Math.max(0, Math.ceil((resendCooldownUntil - Date.now()) / 1000));

        if (resendOtpButton) {
            resendOtpButton.disabled = remaining > 0;
            resendOtpButton.textContent = remaining > 0
                ? `Kirim Ulang OTP (${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")})`
                : "Kirim Ulang OTP";
        }

        if (remaining === 0) {
            clearInterval(resendCountdownTimer);
            resendCountdownTimer = null;
        }
    };

    updateCountdown();

    if (seconds > 0) {
        resendCountdownTimer =
            setInterval(updateCountdown, 250);
    }
}

function showVerification(email, message = "", cooldownSeconds = 0) {
    verificationEmail = email;

    if (verificationEmailLabel) {
        verificationEmailLabel.textContent = email;
    }

    openAuthModal("verify");

    if (otpMessage) {
        otpMessage.textContent = message;
    }

    startResendCooldown(cooldownSeconds);
    otpInput?.focus();
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

document.addEventListener("keydown", (event) => {
    if (
        event.key === "Escape" &&
        authModal &&
        !authModal.classList.contains("hidden")
    ) {
        closeModal();
    }
});


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

        authStatusText.textContent = "Checking...";
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

            if (result.requiresVerification) {
                showVerification(
                    email,
                    result.message ||
                        "Email belum diverifikasi. Masukkan kode OTP atau kirim ulang."
                );
                return;
            }

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

            if (result.requiresVerification) {
                registerForm.reset();
                showVerification(
                    email,
                    result.message ||
                        "Kode OTP telah dikirim ke email Anda.",
                    result.success
                        ? 60
                        : result.retryAfterSeconds || 0
                );
                return;
            }

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

const verifyOtpForm =
    document.getElementById("verifyOtpForm");

if (verifyOtpForm) {
    verifyOtpForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const otp =
            otpInput?.value.trim() || "";

        if (otpMessage) {
            otpMessage.textContent =
                "Memverifikasi email...";
        }

        try {
            const response =
                await fetch("/api/verify-otp", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        email: verificationEmail,
                        otp
                    })
                });

            const result =
                await response.json();

            if (!response.ok || !result.success) {
                if (otpMessage) {
                    otpMessage.textContent =
                        result.message || "Verifikasi gagal.";
                }

                return;
            }

            clearInterval(resendCountdownTimer);
            resendCountdownTimer = null;
            verifyOtpForm.reset();
            openAuthModal("login");

            const loginEmail =
                document.getElementById("loginEmail");

            if (loginEmail) {
                loginEmail.value = verificationEmail;
            }

            if (loginMessage) {
                loginMessage.textContent =
                    "Email berhasil diverifikasi. Silakan login.";
            }

            showToast(
                "Email berhasil diverifikasi. Silakan login.",
                "Berhasil"
            );
        } catch (error) {
            console.error("OTP verification error:", error);

            if (otpMessage) {
                otpMessage.textContent =
                    "Tidak dapat terhubung ke server.";
            }
        }
    });
}

if (resendOtpButton) {
    resendOtpButton.addEventListener("click", async () => {
        if (!verificationEmail) {
            return;
        }

        resendOtpButton.disabled = true;

        if (otpMessage) {
            otpMessage.textContent =
                "Mengirim ulang kode OTP...";
        }

        try {
            const response =
                await fetch("/api/resend-otp", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        email: verificationEmail
                    })
                });

            const result =
                await response.json();

            if (!response.ok || !result.success) {
                if (result.retryAfterSeconds) {
                    startResendCooldown(result.retryAfterSeconds);
                } else {
                    startResendCooldown(0);
                }

                if (otpMessage) {
                    otpMessage.textContent =
                        result.message || "OTP gagal dikirim ulang.";
                }

                return;
            }

            startResendCooldown(60);

            if (otpMessage) {
                otpMessage.textContent =
                    result.message || "Kode OTP baru telah dikirim.";
            }
        } catch (error) {
            console.error("OTP resend error:", error);
            startResendCooldown(0);

            if (otpMessage) {
                otpMessage.textContent =
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

const documentInput =
    document.getElementById("documentInput");

const documentStatus =
    document.getElementById("documentStatus");

const selectedDocument =
    document.getElementById("selectedDocument");

const documentName =
    document.getElementById("documentName");

const removeDocument =
    document.getElementById("removeDocument");

const summaryLength =
    document.getElementById("summaryLength");

const summaryFormat =
    document.getElementById("summaryFormat");

const summaryFormatLabel =
    document.getElementById("summaryFormatLabel");

const summaryFormatHeading =
    document.getElementById("summaryFormatHeading");

const MAX_DOCUMENT_FILE_SIZE =
    5 * 1024 * 1024;

const SUPPORTED_DOCUMENT_EXTENSIONS =
    [".txt", ".pdf", ".docx"];

const SUPPORTED_DOCUMENT_MIME_TYPES = {
    ".txt": [
        "text/plain",
        "text/markdown",
        "application/octet-stream",
        "binary/octet-stream"
    ],
    ".pdf": [
        "application/pdf",
        "application/x-pdf",
        "application/acrobat",
        "application/octet-stream",
        "binary/octet-stream"
    ],
    ".docx": [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/zip",
        "application/x-zip-compressed",
        "application/octet-stream",
        "binary/octet-stream"
    ]
};

let selectedDocumentFile = null;
let textBeforeDocument = "";
let documentRequestController = null;
let documentRequestVersion = 0;


async function readApiResponse(response, fallbackMessage) {
    let result;

    try {
        result = await response.json();
    } catch {
        throw new Error(
            response.ok
                ? "Server mengembalikan response yang tidak valid."
                : fallbackMessage
        );
    }

    if (
        !result ||
        typeof result !== "object" ||
        Array.isArray(result)
    ) {
        throw new Error(
            "Server mengembalikan response yang tidak valid."
        );
    }

    return result;
}


if (textInput && characterCount) {
    textInput.addEventListener("input", updateCharacterCount);
}

if (summarizeButton) {
    summarizeButton.addEventListener(
        "click",
        summarizeText
    );
}

const MIN_SUMMARY_WORDS = 50;

function updateCharacterCount() {
    if (!textInput || !characterCount) {
        return;
    }

    characterCount.textContent =
        `${textInput.value.length.toLocaleString("id-ID")} / 100.000`;
}

function setDocumentStatus(message, state = "") {
    if (!documentStatus) {
        return;
    }

    documentStatus.textContent =
        message;

    documentStatus.classList.remove(
        "is-processing",
        "is-success",
        "is-error"
    );

    if (state) {
        documentStatus.classList.add(state);
    }
}

function setDocumentProcessing(isProcessing) {
    if (!summarizeButton) {
        return;
    }

    summarizeButton.disabled =
        isProcessing;

    if (textInput) {
        textInput.disabled = isProcessing;
    }

    if (buttonText) {
        buttonText.textContent =
            isProcessing
                ? "Membaca dokumen..."
                : "Rangkum Teks";
    }

    if (buttonIcon) {
        buttonIcon.innerHTML =
            isProcessing
                ? '<span class="spinner"></span>'
                : "✦";
    }
}

function clearDocumentSelection(statusMessage = "Belum ada file dipilih") {
    documentRequestVersion += 1;
    documentRequestController?.abort();
    documentRequestController = null;

    selectedDocumentFile = null;

    if (documentInput) {
        documentInput.value = "";
    }

    if (selectedDocument) {
        selectedDocument.classList.add("hidden");
    }

    if (textInput) {
        textInput.value = textBeforeDocument;
        textInput.dispatchEvent(
            new Event("input", { bubbles: true })
        );
    }

    setDocumentStatus(statusMessage);
    setDocumentProcessing(false);
}

async function readSelectedDocument(file) {
    const extension =
        file.name
            .slice(file.name.lastIndexOf("."))
            .toLowerCase();

    if (!SUPPORTED_DOCUMENT_EXTENSIONS.includes(extension)) {
        setDocumentStatus(
            "Format file tidak didukung. Pilih TXT, PDF, atau DOCX.",
            "is-error"
        );
        showToast(
            "Format file tidak didukung. Pilih TXT, PDF, atau DOCX.",
            "Format tidak didukung"
        );
        documentInput.value = "";
        return;
    }

    const mimeType =
        (file.type || "")
            .split(";")[0]
            .trim()
            .toLowerCase();

    if (
        mimeType &&
        !SUPPORTED_DOCUMENT_MIME_TYPES[extension].includes(mimeType)
    ) {
        console.warn(
            "Document MIME type differs from its extension; the server will verify its content.",
            {
                extension,
                mimeType
            }
        );
    }

    if (file.size === 0) {
        setDocumentStatus(
            "File kosong dan tidak dapat dibaca.",
            "is-error"
        );
        showToast(
            "File kosong dan tidak dapat dibaca.",
            "File kosong"
        );
        documentInput.value = "";
        return;
    }

    if (file.size > MAX_DOCUMENT_FILE_SIZE) {
        setDocumentStatus(
            "Ukuran file melebihi batas 5 MB.",
            "is-error"
        );
        showToast(
            "Ukuran file maksimal 5 MB.",
            "File terlalu besar"
        );
        documentInput.value = "";
        return;
    }

    if (!currentUser) {
        documentInput.value = "";
        openAuthModal("login");
        showToast(
            "Silakan login sebelum mengunggah dokumen.",
            "Login diperlukan"
        );
        return;
    }

    if (!selectedDocumentFile) {
        textBeforeDocument =
            textInput?.value || "";
    }

    selectedDocumentFile = file;
    documentRequestController?.abort();
    documentRequestController =
        new AbortController();
    clearSummaryResult();

    const requestVersion =
        ++documentRequestVersion;

    if (documentName) {
        documentName.textContent =
            file.name;
    }

    selectedDocument?.classList.remove("hidden");
    setDocumentStatus(
        `Memproses ${file.name}...`,
        "is-processing"
    );
    setDocumentProcessing(true);

    const formData =
        new FormData();

    formData.append("document", file);

    try {
        const response =
            await fetch(
                "/api/documents/extract",
                {
                    method: "POST",
                    credentials: "include",
                    body: formData,
                    signal: documentRequestController.signal
                }
            );

        const result =
            await readApiResponse(
                response,
                "Server tidak dapat membaca dokumen. Coba lagi setelah server diperbarui."
            );

        if (
            requestVersion !== documentRequestVersion
        ) {
            return;
        }

        if (
            !response.ok ||
            !result.success
        ) {
            if (response.status === 401) {
                openAuthModal("login");
            }

            throw new Error(
                response.status === 404
                    ? "Endpoint pembacaan dokumen belum tersedia. Restart server Summora dengan versi terbaru."
                    : result.message ||
                "Dokumen gagal dibaca."
            );
        }

        if (
            !result.data ||
            typeof result.data.text !== "string" ||
            !result.data.text.trim() ||
            !Number.isInteger(result.data.characterCount)
        ) {
            throw new Error(
                "Dokumen tidak berisi teks yang dapat dirangkum."
            );
        }

        if (textInput) {
            textInput.value =
                result.data.text;
            updateCharacterCount();
        }

        setDocumentStatus(
            `File berhasil dibaca, ${result.data.characterCount.toLocaleString("id-ID")} karakter. Teks dapat diedit sebelum dirangkum.`,
            "is-success"
        );
    } catch (error) {
        if (error.name === "AbortError") {
            return;
        }

        if (
            requestVersion !== documentRequestVersion
        ) {
            return;
        }

        console.error(
            "Document extraction error:",
            error
        );

        if (textInput) {
            textInput.value = textBeforeDocument;
            updateCharacterCount();
        }

        selectedDocumentFile = null;
        selectedDocument?.classList.add("hidden");
        documentInput.value = "";

        const message =
            error.message ||
            "Dokumen gagal dibaca.";

        setDocumentStatus(
            `File gagal dibaca: ${message}`,
            "is-error"
        );
        showToast(message, "Gagal membaca file");
    } finally {
        if (
            requestVersion === documentRequestVersion
        ) {
            documentRequestController = null;
            setDocumentProcessing(false);
        }
    }
}

if (documentInput) {
    documentInput.addEventListener("change", () => {
        const file =
            documentInput.files?.[0];

        if (file) {
            readSelectedDocument(file);
        }
    });
}

if (removeDocument) {
    removeDocument.addEventListener("click", () => {
        clearDocumentSelection();
    });
}

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
        if (selectedDocumentFile) {
            setDocumentStatus(
                "Teks dokumen terlalu pendek untuk dirangkum.",
                "is-error"
            );
        }

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
                        text,
                        summaryLength:
                            summaryLength?.value || "medium",
                        summaryFormat:
                            summaryFormat?.value || "bullets"
                    })
                }
            );

        const result =
            await readApiResponse(
                response,
                "Server tidak dapat membuat rangkuman. Coba lagi setelah server diperbarui."
            );

        if (
            !response.ok ||
            !result.success
        ) {
            throw new Error(
                response.status === 404
                    ? "Endpoint rangkuman belum tersedia. Restart server Summora dengan versi terbaru."
                    : result.message ||
                "Gagal membuat rangkuman."
            );
        }

        if (
            !result.data ||
            typeof result.data.main_idea !== "string" ||
            !result.data.main_idea.trim() ||
            !Array.isArray(result.data.summary_points) ||
            result.data.summary_points.length === 0 ||
            !["short", "medium", "detailed"].includes(
                result.data.summary_length
            ) ||
            !["bullets", "paragraphs", "actions"].includes(
                result.data.summary_format
            ) ||
            result.data.summary_points.some(
                (point) =>
                    typeof point !== "string" ||
                    !point.trim()
            )
        ) {
            throw new Error(
                "AI mengembalikan rangkuman dengan format yang tidak valid. Silakan coba lagi."
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

    const format =
        data.summary_format;

    if (summaryFormatLabel && summaryFormatHeading) {
        const headings = {
            bullets: ["RANGKUMAN POIN", "Poin-poin penting"],
            paragraphs: ["RINGKASAN", "Ringkasan"],
            actions: ["LANGKAH TINDAKAN", "Langkah-langkah penting"]
        };

        const [label, heading] =
            headings[format];

        summaryFormatLabel.textContent =
            label;
        summaryFormatHeading.textContent =
            heading;
    }

    if (mainIdea) {
        mainIdea.textContent =
            data.main_idea || "-";
    }

    if (summaryPoints) {
        renderSummaryPoints(
            summaryPoints,
            data.summary_points,
            format
        );
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

function getParagraphBlocks(points) {
    return points
        .flatMap((point) => String(point).split(/\n\s*\n/))
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);
}

function renderSummaryPoints(container, points, format) {
    container.replaceChildren();
    container.classList.toggle(
        "summary-points--paragraphs",
        format === "paragraphs"
    );
    container.classList.remove("summary-points--actions");

    if (format === "paragraphs") {
        getParagraphBlocks(points).forEach((paragraph) => {
            const item =
                document.createElement("p");

            item.textContent = paragraph;
            container.appendChild(item);
        });
        return;
    }

    const isActions =
        format === "actions";
    const list =
        document.createElement(isActions ? "ol" : "ul");

    list.className = [
        "summary-points__list",
        isActions ? "summary-points__list--actions" : ""
    ].filter(Boolean).join(" ");

    points.forEach((point) => {
        const item =
            document.createElement("li");

        item.textContent = point;
        list.appendChild(item);
    });

    container.appendChild(list);
}

function setLoading(isLoading) {
    if (!summarizeButton) {
        return;
    }

    summarizeButton.disabled =
        isLoading;

    if (textInput) {
        textInput.disabled = isLoading;
    }

    if (documentInput) {
        documentInput.disabled = isLoading;
    }

    if (removeDocument) {
        removeDocument.disabled = isLoading;
    }

    if (summaryLength) {
        summaryLength.disabled = isLoading;
    }

    if (summaryFormat) {
        summaryFormat.disabled = isLoading;
    }

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

        const summaryFormat =
            ["bullets", "paragraphs", "actions"].includes(item.summary_format)
                ? item.summary_format
                : "bullets";
        const isParagraphs =
            summaryFormat === "paragraphs";
        const isActions =
            summaryFormat === "actions";
        const isBullets =
            summaryFormat === "bullets";
        const pointsContainerTag =
            isParagraphs ? "div" : isActions ? "ol" : "ul";
        const pointTag =
            isParagraphs
                ? "p"
                : "li";
        const pointsClass = [
            "history-points",
            isParagraphs ? "history-points--paragraphs" : "",
            isActions ? "history-points--actions" : ""
        ].filter(Boolean).join(" ");
        const historyPoints =
            isParagraphs
                ? getParagraphBlocks(points)
                : points;
        const pointsMarkup =
            historyPoints.length > 0
                ? historyPoints.map(
                    (point) => `
                        <${pointTag}>
                            ${escapeHTML(point)}
                        </${pointTag}>
                    `
                ).join("")
                : `
                    <${pointTag}>
                        ${isParagraphs ? "Tidak ada isi ringkasan." : "Tidak ada poin penting."}
                    </${pointTag}>
                `;
        const historyDetailsLabel =
            summaryFormat === "paragraphs"
                ? "Ringkasan"
                : isActions
                    ? "Langkah-langkah Penting"
                    : isBullets
                        ? "Poin-poin Penting"
                        : "Ringkasan";
        const historyExpandLabel =
            isActions
                ? "Lihat langkah"
                : isBullets
                    ? "Lihat poin penting"
                    : "Lihat ringkasan";

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
                        ${historyExpandLabel}
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
                            ${historyDetailsLabel}
                        </span>
                    </div>

                    <${pointsContainerTag} class="${pointsClass}">
                        ${pointsMarkup}
                    </${pointsContainerTag}>

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

                    const formattedPoints =
                        isParagraphs
                            ? summaryPointTexts.join("\n\n")
                            : isActions
                                ? summaryPointTexts.map(
                                    (point, index) =>
                                        `${index + 1}. ${point}`
                                ).join("\n")
                                : summaryPointTexts.map(
                                    (point) =>
                                        `- ${point}`
                                ).join("\n");
                    const textToCopy =
                        [
                            mainIdeaText,
                            "",
                            formattedPoints
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

document.addEventListener("keydown", function (event) {
    
    if (event.key === "F12") {
        event.preventDefault();
        return false;
    }

    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "i") {
        event.preventDefault();
        return false;
    }

    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "j") {
        event.preventDefault();
        return false;
    }

    if (event.ctrlKey && event.key.toLowerCase() === "u") {
        event.preventDefault();
        return false;
    }
});


document.addEventListener("contextmenu", function (event) {
    event.preventDefault();
});