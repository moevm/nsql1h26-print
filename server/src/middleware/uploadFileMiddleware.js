import multer from 'multer';
import path from 'path';


const uploadDir = path.join(process.cwd(), 'uploads/orders');


// Настройка хранения файлов
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `order-${uniqueSuffix}${ext}`);
    }
});

// Фильтр файлов (только разрешённые типы)
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Неподдерживаемый тип файла. Разрешены: PDF, JPG, PNG, DOC'));
    }
};

// Создаём middleware для загрузки одного файла
export const uploadOrderFile = multer({ 
    storage,
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50 MB лимит
}).single('file');


export const UPLOAD_DIR = uploadDir;