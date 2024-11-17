const ITEMS_PER_PAGE = 25;
let currentTransactions = []; // Menyimpan semua data transaksi yang terurut

function triggerFileUpload() {
    document.getElementById('fileInput').click();
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    const validExtensions = ['xlsx', 'xls', 'csv'];

    if (!validExtensions.includes(file.name.split('.').pop().toLowerCase())) {
        Swal.fire({
            title: 'Peringatan',
            text: 'Format excel tidak sesuai',
            icon: 'warning',
            confirmButtonText: 'Oke',
            customClass: {
                confirmButton: 'uploadfile-button'
            }
        });
        document.getElementById('fileInput').value = ''; // Reset the input file
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        let formattedData = "";
        jsonData.forEach((row, index) => {
            if (index === 0) {
                formattedData += row.join('\t') + '\n';
            } else {
                formattedData += row.join('\t') + '\n';
            }
        });

        document.getElementById('textDataInput').value = formattedData.trim();
    };

    reader.readAsArrayBuffer(file);
}

function showCustomTextPopup() {
    const overlay = document.getElementById('customTextPopupOverlay');
    const popup = document.getElementById('customTextPopup');
    overlay.style.display = 'flex';
    popup.style.display = 'flex';
}

function closeTextPopup() {
    const overlay = document.getElementById('customTextPopupOverlay');
    const popup = document.getElementById('customTextPopup');
    overlay.style.display = 'none';
    popup.style.display = 'none';
}

function processTextData() {
    const textData = document.getElementById('textDataInput').value;
    const additionalInput = document.getElementById('additionalInputText').value;
    const switchElement = document.getElementById('switchText');
    const isSwitchChecked = switchElement.checked;

    if (!textData) {
        showWarning('Anda harus memasukkan data teks untuk melanjutkan.', showCustomTextPopup);
        return;
    }

    if (isSwitchChecked && !additionalInput) {
        switchElement.checked = false; // Geser switch ke kiri
        handleSwitchChangeText(); // Ubah placeholder input tambahan
    }

    const invalidProducts = checkInvalidProducts(textData, additionalInput);
    if (invalidProducts.length > 0) {
        showInvalidProductsWarning(invalidProducts, () => {
            checkTextFormat(textData, 'text', additionalInput, switchElement.checked);
        });
    } else {
        checkTextFormat(textData, 'text', additionalInput, switchElement.checked);
    }
}

function checkInvalidProducts(textData, additionalInput) {
    const productList = additionalInput ? additionalInput.split(',').map(item => item.trim()) : [];
    const dataLines = textData.split('\n');
    const productSet = new Set();

    dataLines.slice(1).forEach(line => {
        const productCode = line.trim().split(/\s+/)[1];
        productSet.add(productCode);
    });

    return productList.filter(product => !productSet.has(product));
}

function showInvalidProductsWarning(invalidProducts, callback) {
    Swal.fire({
        title: 'Peringatan',
        html: `Kode produk <strong>${invalidProducts.join(', ')}</strong> tidak ditemukan dalam data yang diimport. Apakah Anda ingin melanjutkan import?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Lanjutkan',
        cancelButtonText: 'Batal',
        customClass: {
            confirmButton: 'uploadfile-button',
            cancelButton: 'swal2-cancel swal2-styled'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            callback();
        }
    });
}

function handleSwitchChangeText() {
    const switchElement = document.getElementById('switchText');
    const additionalInput = document.getElementById('additionalInputText');

    if (switchElement.checked) {
        additionalInput.placeholder = "Produk Khusus (Opsional)";
    } else {
        additionalInput.placeholder = "Kecualikan Produk (Opsional)";
    }
}

// Fungsi untuk menampilkan halaman tabel berdasarkan nomor halaman
function updateTablePage(pageNumber) {
    const resultTable = document.getElementById('resultTable').getElementsByTagName('tbody')[0];
    resultTable.innerHTML = '';

    const start = (pageNumber - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const paginatedItems = currentTransactions.slice(start, end);

    paginatedItems.forEach((item, index) => {
        const row = resultTable.insertRow();
        row.insertCell(0).innerText = start + index + 1;
        row.insertCell(1).innerText = item.id;
        row.insertCell(2).innerText = formatNumber(item.count);
        row.insertCell(3).innerText = 'Level ' + (start + index + 1);
    });
}

// Fungsi untuk membuat pagination berdasarkan total data dan jumlah item per halaman
function generatePagination(totalItems, itemsPerPage) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    // Cek jika total item kurang dari atau sama dengan 15, maka jangan tampilkan pagination
    if (totalItems <= itemsPerPage) {
        pagination.style.display = 'none'; // Sembunyikan pagination
        return;
    }

    pagination.style.display = 'flex'; // Tampilkan pagination jika lebih dari 15 item

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const maxVisiblePages = 5; // Jumlah maksimal halaman yang ditampilkan
    let currentPage = 1;

    function renderPagination(page) {
        pagination.innerHTML = '';
        
        // Tentukan halaman awal dan akhir yang akan ditampilkan
        let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        // Jika halaman yang ditampilkan tidak penuh 5 halaman, sesuaikan startPage
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // Tambahkan tanda "<<" jika halaman pertama tidak terlihat
        if (startPage > 1) {
            const liPrev = document.createElement('li');
            liPrev.className = 'page-item';
            liPrev.innerHTML = `<a class="page-link" href="#"><</a>`;
            liPrev.onclick = function (event) {
                event.preventDefault(); // Mencegah scroll ke atas
                const prevPage = Math.max(1, startPage - maxVisiblePages);
                updateTablePage(prevPage);
                renderPagination(prevPage); // Render ulang pagination untuk halaman sebelumnya
            };
            pagination.appendChild(liPrev);
        }

        // Tambahkan nomor halaman
        for (let i = startPage; i <= endPage; i++) {
            const li = document.createElement('li');
            li.className = 'page-item';
            li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            if (i === page) {
                li.classList.add('active'); // Tandai halaman yang aktif
            }
            li.onclick = function (event) {
                event.preventDefault(); // Mencegah scroll ke atas
                updateTablePage(i);
                renderPagination(i); // Render ulang pagination dengan halaman baru
            };
            pagination.appendChild(li);
        }

        // Tambahkan tanda ">>" jika masih ada halaman berikutnya
        if (endPage < totalPages) {
            const liNext = document.createElement('li');
            liNext.className = 'page-item';
            liNext.innerHTML = `<a class="page-link" href="#">></a>`;
            liNext.onclick = function (event) {
                event.preventDefault(); // Mencegah scroll ke atas
                const nextPage = endPage + 1;
                updateTablePage(nextPage);
                renderPagination(nextPage); // Render ulang pagination untuk halaman berikutnya
            };
            pagination.appendChild(liNext);
        }
    }

    // Inisialisasi pagination dengan halaman pertama
    renderPagination(1);
}

function showWarning(message, retryCallback) {
    Swal.fire({
        title: 'Peringatan',
        text: message,
        icon: 'warning',
        confirmButtonText: 'Oke',
        allowOutsideClick: false,
        customClass: {
            confirmButton: 'uploadfile-button'
        }
    }).then(() => {
        retryCallback();
    });
}

function checkTextFormat(textData, type, additionalInput, isSwitchChecked) {
    const lines = textData.split('\n');
    if (lines.length > 0 && lines[0].trim().split(/\s+/)[0] === 'ID' && lines[0].trim().split(/\s+/)[1] === 'Agen') {
        showUploadConfirmation(() => uploadfileTableFromText(textData, additionalInput, isSwitchChecked), type, textData);
    } else {
        showWarning('Format data yang diinput salah, Silahkan coba lagi dengan format yang benar!', showCustomTextPopup);
    }
}

function showUploadConfirmation(callback, type, inputData) {
    document.getElementById('customTextPopupOverlay').style.display = 'none'; // Hide the "Enter Text Data" popup
    Swal.fire({
        title: 'Konfirmasi',
        html: '<div style="font-size: 15px; font-family: Calibri;">Transaksi hanya akan dihitung jika Status Transaksi adalah "SUCCESS". Data dengan status lain, seperti "Failed", tidak akan dihitung karena Tools ini hanya menghitung berdasarkan Status Transaksi "SUCCESS".<br><br>Jika Anda sudah yakin, silakan klik "Lanjutkan".</div>',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Lanjutkan',
        cancelButtonText: 'Batal',
        allowOutsideClick: false,
        customClass: {
            confirmButton: 'uploadfile-button',
            cancelButton: 'swal2-cancel swal2-styled'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            callback();
        } else if (result.isDismissed) {
            if (type === 'text') {
                showCustomTextPopup(inputData);
            }
        }
    });
}

function uploadfileTableFromText(textData, additionalInput, isSwitchChecked) {
    Swal.fire({
        title: 'Processing...',
        text: 'Mohon ditunggu sedang proses import data.',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    setTimeout(() => {
        const transactions = {};
        const lines = textData.split('\n');
        const productList = additionalInput ? additionalInput.split(',').map(item => item.trim()) : [];

        if (lines.length > 0 && lines[0].trim() !== "") {
            lines.slice(1).forEach(line => {
                const [id, productCode, status] = line.trim().split(/\s+/);

                const shouldInclude = isSwitchChecked
                    ? productList.includes(productCode)
                    : !productList.includes(productCode);

                if (status === 'SUCCESS' && shouldInclude) {
                    if (transactions[id]) {
                        transactions[id]++;
                    } else {
                        transactions[id] = 1;
                    }
                }
            });

            currentTransactions = Object.keys(transactions).map(id => ({
                id,
                count: transactions[id]
            })).sort((a, b) => b.count - a.count);

            generatePagination(currentTransactions.length, ITEMS_PER_PAGE);
            updateTablePage(1);

            updateSummary(currentTransactions.length, currentTransactions.reduce((sum, item) => sum + item.count, 0));

            Swal.fire('Success', 'Data berhasil diupload.', 'success');
            showExportResetButtons();
            document.getElementById('summary').style.display = 'block';

            document.getElementById('textDataInput').value = '';
            document.getElementById('additionalInputText').value = '';
            document.getElementById('switchText').checked = false;
        } else {
            showWarning('Data teks tidak mengandung informasi yang valid.', showCustomTextPopup);
        }
    }, 2000);
}

function updateSummary(jumlahagen, jumlatrxhagen) {
    const summary = document.getElementById('summary');
    summary.innerHTML = `Jumlah Agen: ${jumlahagen} <br> Jumlah Transaksi: ${formatNumber(jumlatrxhagen)}`;
}

function showExportResetButtons() {
    const uploadContainer = document.getElementById('uploadContainer');
    uploadContainer.innerHTML = `
<button class="upload-container" style="background: green;" onclick="exportData()">Export Data</button>
<button class="upload-container" onclick="resetData()">Reset Data</button>
`;
}

function exportData() {
    Swal.fire({
        title: 'Export Data',
        html: `
        <div style="font-size: 17px; text-align: center; margin-bottom: 10px;">
            Tuliskan nama file sesuai keinginanmu.
        </div>
        <input type="text" id="fileNameInput" class="swal2-input" placeholder="Tuliskan nama file..." style="width: 300px; height: auto; padding: 10px;" />
    `,
        showCancelButton: true,
        confirmButtonText: 'Lanjutkan',
        cancelButtonText: 'Batal',
        allowOutsideClick: false,
        customClass: {
            confirmButton: 'uploadfile-button',
            cancelButton: 'swal2-cancel swal2-styled'
        }
    }).then((result) => {
        if (result.dismiss === Swal.DismissReason.cancel) {
            return; // Jika tombol Batal diklik, keluar dari fungsi tanpa melakukan apapun
        }

        const fileName = document.getElementById('fileNameInput').value;
        if (!fileName) {
            Swal.fire({
                title: 'Peringatan',
                html: 'Harap masukkan nama file. Misalnya "Balapan transaksi bulan Juni 2024" silahkan bisa diisi sesuai keinginan.',
                icon: 'warning',
                confirmButtonText: 'Oke',
                allowOutsideClick: false,
                customClass: {
                    confirmButton: 'uploadfile-button'
                }
            }).then(() => {
                exportData(); // Kembali ke popup export data jika nama file tidak diisi
            });
        } else {
            Swal.fire({
                title: 'Exporting...',
                text: 'Harap ditunggu, sedang proses export data.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            setTimeout(() => {
                try {
                    exportToExcel(fileName);
                    Swal.fire('Success', 'Data berhasil diexport.', 'success');
                } catch (error) {
                    Swal.fire('Error', 'Gagal mengekspor data.', 'error');
                }
            }, 2000);
        }
    });
}

function exportToExcel(fileName) {
    const wb = XLSX.utils.book_new();

    // Create worksheet from currentTransactions data
    const data = [['No.', 'ID Agen', 'Jumlah Transaksi', 'Level']];
    currentTransactions.forEach((item, index) => {
        data.push([index + 1, item.id, formatNumber(item.count), 'Level ' + (index + 1)]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    
    const sheetName = 'Balapan Transaksi';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Apply styling to the worksheet as needed
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
            if (!ws[cell_address]) ws[cell_address] = {};
            if (!ws[cell_address].s) ws[cell_address].s = {};
            ws[cell_address].s.border = {
                top: { style: "thin", color: { auto: 1 } },
                bottom: { style: "thin", color: { auto: 1 } },
                left: { style: "thin", color: { auto: 1 } },
                right: { style: "thin", color: { auto: 1 } }
            };
            ws[cell_address].s.alignment = { vertical: "center", horizontal: "center" };
            ws[cell_address].s.font = { name: "Calibri", sz: 11 };
        }
    }

    // Apply bold font to the header row
    const headerRange = XLSX.utils.decode_range(ws['!ref']);
    for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
        const cell_address = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!ws[cell_address]) ws[cell_address] = {};
        if (!ws[cell_address].s) ws[cell_address].s = {};
        ws[cell_address].s.font = { bold: true, name: "Calibri", sz: 11 };
    }

    // Write the file
    XLSX.writeFile(wb, `${fileName}.xlsx`);
}

function resetData() {
    const resultTable = document.getElementById('resultTable').getElementsByTagName('tbody')[0];
    resultTable.innerHTML = '';
    const uploadContainer = document.getElementById('uploadContainer');
    uploadContainer.innerHTML = `
<button id="uploadButton" onclick="showCustomTextPopup()">Upload Data</button>
<button id="tutorialButton" onclick="showCustomTutorial()">Tutorial</button>
`;
    const summary = document.getElementById('summary');
    summary.style.display = 'none';
    summary.innerHTML = 'Jumlah Agen: <br> Jumlah Transaksi:';

    Swal.fire({
        title: 'Success',
        text: 'Data berhasil direset.',
        icon: 'success',
        confirmButtonText: 'Oke Sipp',
        allowOutsideClick: false,
        customClass: {
            confirmButton: 'uploadfile-button'
        }
    }).then(() => {
        location.reload(); // Reload the page after the alert is confirmed
    });
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function showCustomTutorial() {
    const overlay = document.getElementById('customPopupOverlay');
    const videoFrame = document.getElementById('tutorialVideo');
    const loadingContainer = document.getElementById('loadingContainer');
    const loadingSpinner = document.getElementById('loadingSpinner');

    overlay.style.display = 'flex';
    videoFrame.style.display = 'none';
    loadingContainer.style.display = 'flex';

    videoFrame.src = videoFrame.src + "?autoplay=1";

    videoFrame.onload = () => {
        loadingSpinner.style.display = 'none';
        loadingContainer.style.display = 'none';
        videoFrame.style.display = 'block';
    };
}

function closeCustomPopup() {
    const overlay = document.getElementById('customPopupOverlay');
    const videoFrame = document.getElementById('tutorialVideo');

    overlay.style.display = 'none';
    videoFrame.src = videoFrame.src.replace("?autoplay=1", "");
    videoFrame.style.display = 'none';
    const loadingSpinner = document.getElementById('loadingSpinner');
    loadingSpinner.style.display = 'flex';
}

const style = document.createElement('style');
style.innerHTML = `
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
`;
document.head.appendChild(style);

function handleSwitchClick() {
    const switchIcon = document.getElementById('switchIcon');
    switchIcon.classList.add('rotate-animation');

    switchIcon.addEventListener('animationend', () => {
        switchIcon.classList.remove('rotate-animation');
        Swal.fire({
            title: 'Loading...',
            text: 'Please wait...',
            timer: 1000,
            timerProgressBar: true,
            didOpen: () => {
                Swal.showLoading();
            },
            willClose: () => {
                window.location.href = "https://k4ngujang.github.io/produk-terlaris/";
            }
        });
    }, { once: true });
}
