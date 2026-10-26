# دليل وخطة رفع المنصة على الاستضافة الحية (Production Deployment Guide)

تم تجهيز المنصة بالكامل في حزمة موحدة تجمع واجهة React المترجمة (`SPA Production Build`) مع خادم Laravel ومكتبات `vendor/` في ملف مضغوط واحد جاهز للرفع المباشر دون الحاجة لتشغيل `npm` أو `composer` على السيرفر.

* **مسار الحزمة الجاهزة للرفع:** `c:\laragon\www\editorPlatform\editor-platform-production.zip`

---

## أولاً: ما الذي تم تأمينه وتجهيزه داخل الحزمة؟

1. **دمج الواجهة الأمامية والخادم تحت نطاق واحد (Single-Origin SPA):**
   - تم بناء تطبيق React للإنتاج ودمجه داخل مجلد `public/` (`public/app.html` + `public/assets/*`).
   - توجيه جميع مسارات الواجهة (`/publications`, `/posts/*`, `/admin/*`, `/login`, `/profile`) عبر Laravel ليعمل الموقع بالكامل على نطاق واحد بدون أي مشاكل في الكوكيز (`Sanctum Stateful Cookies`) أو `CORS`.
2. **دعم عرض الصور والملفات حتى لو كانت الاستضافة تمنع `symlink`:**
   - إضافة مسار احتياطي ذكي في `routes/web.php` يخدم ملفات `storage/app/public` تلقائياً في حال عدم تفعيل `storage:link` على الاستضافة المشتركة.
3. **إغلاق الثغرات الأمنية للإنتاج (Production Hardening):**
   - تعطيل الدخول التجريبي الوهمي بجوجل خارج البيئة المحلية (`local`).
   - قصر تعديل الإعدادات العامة وهوية المؤلف على رتبة `admin` فقط.
   - إخفاء تفاصيل الأخطاء البرمجية الحساسة عند تفعيل `APP_DEBUG=false`.
   - منع القراء المسجلين ذاتياً من الدخول إلى مسارات لوحة الإدارة `/admin`.

---

## ثانياً: متطلبات الاستضافة

* **إصدار PHP:** `8.2` أو `8.3` أو `8.4`
* **إضافات PHP المطلوبة:** `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `json`, `fileinfo`, `bcmath` (مفعلة افتراضياً في كافة استضافات cPanel / Hostinger).
* **قاعدة بيانات:** MySQL 8.0+ أو MariaDB 10.6+

---

## ثالثاً: خطوات الرفع خطوة بخطوة (cPanel / Hostinger / DirectAdmin)

### الخطوة 1: إنشاء قاعدة البيانات
1. من لوحة تحكم الاستضافة، افتح **MySQL Databases** (أو **MySQL Database Wizard**).
2. أنشئ قاعدة بيانات جديدة (مثلاً: `u12345_editor`).
3. أنشئ مستخدم قاعدة بيانات بكلمة مرور قوية، وامنحه **كافة الصلاحيات (ALL PRIVILEGES)** على القاعدة.

---

### الخطوة 2: رفع الحزمة وفك الضغط

لديك طريقتان حسب نوع الاستضافة:

#### الطريقة (أ) — الأفضل أمنياً (إذا كان يمكنك تحديد Document Root أو نقل مجلد `public`):
1. ارفع ملف `editor-platform-production.zip` إلى مجلد خاص خارج `public_html`، مثلاً: `/home/username/editor_app/`.
2. فك الضغط هناك.
3. من إعدادات النطاق (**Domains** في cPanel)، اجعل **Document Root** يشير إلى:
   `/home/username/editor_app/public`
   *(أو انقل محتويات مجلد `public/` إلى `public_html/` وعدّل مسار `vendor/autoload.php` و`bootstrap/app.php` في `public_html/index.php` ليشير إلى `../editor_app/...`)*.

#### الطريقة (ب) — السريعة للاستضافات المشتركة العادية:
1. ارفع `editor-platform-production.zip` داخل `public_html/` وفك الضغط.
2. أنشئ ملف `.htaccess` في جذر `public_html/` (بجانب مجلد `public`) يحتوي على:
   ```apache
   <IfModule mod_rewrite.c>
       RewriteEngine On
       RewriteRule ^(.*)$ public/$1 [L]
   </IfModule>
   ```

---

### الخطوة 3: إعداد ملف البيئة `.env`
1. في المجلد الرئيسي للتطبيق على الاستضافة، انسخ ملف `.env.production.example` وأعد تسميته إلى `.env`.
2. افتح ملف `.env` وعدّل القيم التالية:
   ```env
   APP_NAME="منصة الكاتب الأدبية"
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://yourdomain.com

   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=اسم_قاعدة_البيانات
   DB_USERNAME=اسم_مستخدم_القاعدة
   DB_PASSWORD=كلمة_مرور_القاعدة

   SESSION_DRIVER=database
   SESSION_DOMAIN=yourdomain.com
   SESSION_SECURE_COOKIE=true
   SANCTUM_STATEFUL_DOMAINS=yourdomain.com,www.yourdomain.com

   # بيانات حساب المدير العام الذي سيتم إنشاؤه
   ADMIN_NAME="المدير العام"
   ADMIN_EMAIL=admin@yourdomain.com
   ADMIN_PASSWORD=كلمة_مرور_قوية_جداً
   ```

---

### الخطوة 4: تشغيل أوامر التهيئة (عبر SSH أو Terminal في cPanel)
افتح **Terminal** من لوحة cPanel، وانتقل لمجلد المشروع ثم نفذ الأوامر التالية بالترتيب:

```bash
# 1. توليد مفتاح التشفير الخاص بالتطبيق
php artisan key:generate --force

# 2. إنشاء جداول قاعدة البيانات
php artisan migrate --force

# 3. زراعة البيانات الأساسية (الأدوار، الصلاحيات، المؤلف الافتراضي، وحساب المدير العام)
php artisan db:seed --force

# 4. ربط مجلد التخزين العام (اختياري، ويوجد بديل تلقائي إن كان معطلاً)
php artisan storage:link

# 5. تسريع الأداء وتخزين الإعدادات والمسارات
php artisan optimize
```

> **ملاحظة في حال عدم توفر SSH / Terminal على الاستضافة:**
> يمكنك تصدير قاعدة البيانات من جهازك المحلي بصيغة `.sql` واستيرادها عبر **phpMyAdmin** على الاستضافة، ونسخ قيمة `APP_KEY` من ملف `.env` المحلي إلى ملف `.env` على السيرفر.

---

### الخطوة 5: صلاحيات المجلدات
تأكد أن مجلدي `storage/` و `bootstrap/cache/` يمتلكان صلاحية الكتابة (`755` أو `775`):
```bash
chmod -R 775 storage bootstrap/cache
```

---

## رابعاً: اختبار المنصة بعد الرفع

1. افتح رابط موقعك `https://yourdomain.com`: ستظهر الصفحة الرئيسية (خلاصة الأخبار والمنشورات) مع الشريط الجانبي للجمهور.
2. اضغط على **دخول / تسجيل** -> تبويب **إنشاء حساب قارئ جديد**: جرب التسجيل ببريد إلكتروني حقيقي وتأكد من الدخول الفوري وإمكانية كتابة تعليق.
3. سجل الدخول بحساب المدير العام (`ADMIN_EMAIL` و `ADMIN_PASSWORD`) الذي حددته في `.env`:
   - سيظهر لك قسم **إدارة النظام والمحتوى (مشرف)** في الشريط الجانبي الدائم.
   - ستتمكن من نشر المقالات والكتب، وتعديل اسم المؤلف والإعدادات العامة من `/admin/settings`.
