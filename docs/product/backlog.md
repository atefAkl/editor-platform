تمام يا كوتش. نعتمد الاتجاه ده.

هناخدها على مرحلتين: Product Backlog كامل للـ MVP ثم نستخرج منه Sprint 1، وبعد اعتمادك نكتب Prompt Antigravity.

Product Backlog — MVP v0.1
Epic 01 — Platform Foundation
ID	User Story	Priority
PB-01	إنشاء المشروع باستخدام Laravel	Must
PB-02	إعداد MySQL والـ database configuration	Must
PB-03	إعداد React + Vite	Must
PB-04	إعداد Tailwind CSS	Must
PB-05	إنشاء Laravel API foundation	Must
PB-06	تعريف هيكل المشروع وقواعد فصل Backend / Frontend	Must
PB-07	إعداد Authentication للوحة الإدارة	Must
PB-08	إعداد مستخدم Admin واحد	Must
PB-09	إعداد إدارة الملفات والـ storage	Should
PB-10	وضع معايير موحدة للـ API responses	Must
PB-11	وضع أساس validation وerror handling	Must
PB-12	إعداد Testing foundation	Must
Epic 02 — Admin Application
ID	User Story	Priority
PB-13	إنشاء Admin Layout	Must
PB-14	إنشاء Sidebar	Must
PB-15	إنشاء Header	Must
PB-16	إنشاء Content Area	Must
PB-17	إنشاء Dashboard	Must
PB-18	إنشاء Navigation للكتب	Must
PB-19	إنشاء Navigation للأخبار	Must
PB-20	التعامل مع حالات Loading / Empty / Error	Must
PB-21	Responsive behavior الأساسي	Should
Epic 03 — Books Management

وده أول Feature حقيقي.

ID	User Story	Priority
PB-22	عرض قائمة الكتب	Must
PB-23	إضافة كتاب	Must
PB-24	تعديل كتاب	Must
PB-25	عرض تفاصيل كتاب	Must
PB-26	حذف/أرشفة كتاب	Must
PB-27	حفظ الكتاب كمسودة	Must
PB-28	نشر الكتاب	Must
PB-29	رفع غلاف الكتاب	Must
PB-30	إضافة مقدمة الكتاب	Must
PB-31	رفع ملف الكتاب	Must
PB-32	استبدال ملف الكتاب	Should
PB-33	التحقق من الملفات المرفوعة	Must
PB-34	معاينة بيانات الكتاب قبل النشر	Should
بيانات الكتاب — MVP

مبدئيًا:

Book
├── Title
├── Subtitle
├── Description
├── Author
├── Publication Date
├── Cover
├── Introduction
├── Book File
├── Status
└── Published At

ولا ندخل حاليًا:

Table of Contents
Gallery
Editions
Pricing
Purchase
Reviews
Comments
Online Reader

دي مراحل لاحقة.

Epic 04 — News Management
ID	User Story	Priority
PB-35	عرض قائمة الأخبار	Must
PB-36	إنشاء خبر	Must
PB-37	تعديل خبر	Must
PB-38	عرض تفاصيل الخبر	Must
PB-39	حذف/أرشفة خبر	Must
PB-40	حفظ الخبر كمسودة	Must
PB-41	نشر الخبر	Must
PB-42	إضافة صورة للخبر	Should
PB-43	ربط الخبر بكتاب	Should
PB-44	تحديد تاريخ النشر	Should
PB-45	معاينة الخبر	Should
Epic 05 — Public Foundation

مش هننفذه كله في أول Sprint، لكنه جزء من الـ MVP.

ID	User Story	Priority
PB-46	إنشاء Public Layout	Must
PB-47	الصفحة الرئيسية	Must
PB-48	صفحة الكتب	Must
PB-49	صفحة الكتاب	Must
PB-50	صفحة الأخبار	Must
PB-51	صفحة الخبر	Must
PB-52	عرض حالة الكتاب	Must
PB-53	عرض الأخبار المنشورة فقط	Must
Epic 06 — MVP Search & Discovery
ID	User Story	Priority
PB-54	البحث في الكتب	Should
PB-55	البحث في الأخبار	Should
PB-56	فلترة الكتب	Could
PB-57	ترتيب الكتب	Could
PB-58	Pagination	Must
خارج MVP حاليًا

عشان ما يحصلش Scope Creep:

Membership
Payments
Orders
Purchases
Special Editions
Offers
Comments
Likes
Favorites
Following
Online Reading
Download permissions
Reader accounts
Reader-generated posts
Series
Topics
Tags
Advanced Media Library
Analytics
SEO management
Notifications
Email
Social integrations

كل دي Backlog لاحق وليست جزءًا من MVP الأول.

Sprint 1

وبناءً على الـ Backlog، Sprint 1 عندي يكون:

Sprint Goal

إنشاء الأساس التقني والتطبيقي للمنصة، مع لوحة إدارة قابلة للتشغيل وتسجيل دخول Admin، وتجهيز الهيكل الذي ستُبنى عليه Modules الكتب والأخبار.

Sprint Backlog
ID	Story	Status
S1-01	Laravel Foundation	⬜
S1-02	MySQL Configuration	⬜
S1-03	React + Vite	⬜
S1-04	Tailwind CSS	⬜
S1-05	API Foundation	⬜
S1-06	Authentication	⬜
S1-07	Admin User	⬜
S1-08	Admin Layout	⬜
S1-09	Sidebar	⬜
S1-10	Header	⬜
S1-11	Dashboard	⬜
S1-12	Books Module Skeleton	⬜
S1-13	News Module Skeleton	⬜
S1-14	Validation/Error Foundation	⬜
S1-15	API Response Convention	⬜
S1-16	Testing Foundation	⬜
Definition of Done لـ Sprint 1

مش هنعتبر Sprint 1 انتهى لمجرد إن الصفحات ظهرت.

لازم:

المشروع يعمل على Laragon.
Laravel يعمل بدون أخطاء.
MySQL متصل.
React يعمل.
Vite يعمل.
Tailwind يعمل.
Admin يستطيع تسجيل الدخول.
Admin يستطيع تسجيل الخروج.
الـ Admin Layout يعمل.
Sidebar يحتوي على Books وNews.
Dashboard يعمل.
Books وNews لهما صفحات placeholder صحيحة.
API foundation يعمل.
Validation/error handling الأساسي موجود.
الاختبارات الأساسية تعمل.
لا توجد أخطاء Console غير مبررة.
لا توجد أخطاء Laravel/PHP غير مبررة.
الكود منظم وفق الـ architecture المتفق عليها.
لا يتم إدخال Features خارج Sprint.
والأهم

Antigravity لا يقرر من نفسه تغيير الـ Scope أو الـ Architecture.

لو اكتشف أثناء التنفيذ قرارًا معماريًا يحتاج تغييرًا:

يتوقف عند النقطة ويعرض المشكلة والبدائل لنا.

وده مهم جدًا لأننا نريد أن يكون Antigravity مطورًا منفذًا داخل الفريق، وليس صاحب قرار منتج مستقل.

بعد اعتماد الـ Backlog

الخطوة التالية ليست الكود.

سأكتب لنا:

SPRINT-01-IMPLEMENTATION-PROMPT.md

ويكون Prompt واحدًا واضحًا لـ Antigravity يحتوي على:

Context المشروع.
الهدف.
الـ Stack.
Architecture constraints.
Sprint Goal.
Sprint Backlog.
Acceptance Criteria لكل Story.
Definition of Done.
قواعد عدم اتخاذ قرارات خارج الـ Scope.
قواعد الاختبار.
المطلوب منه عند اكتشاف مشكلة.
شكل تقرير نهاية التنفيذ.