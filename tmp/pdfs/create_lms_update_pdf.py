from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether

root = Path(__file__).resolve().parents[2]
out = root / 'output' / 'pdf' / 'IMS_LMS_Functionality_Update.pdf'
out.parent.mkdir(parents=True, exist_ok=True)

navy = colors.HexColor('#111827')
violet = colors.HexColor('#6D28D9')
soft_violet = colors.HexColor('#F3E8FF')
green = colors.HexColor('#047857')
grey = colors.HexColor('#6B7280')

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='TitleX', parent=styles['Title'], fontName='Helvetica-Bold', fontSize=25, leading=30, textColor=navy, alignment=TA_CENTER, spaceAfter=10))
styles.add(ParagraphStyle(name='SubX', parent=styles['Normal'], fontName='Helvetica', fontSize=10, leading=15, textColor=grey, alignment=TA_CENTER, spaceAfter=22))
styles.add(ParagraphStyle(name='H1X', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=16, leading=21, textColor=violet, spaceBefore=12, spaceAfter=8))
styles.add(ParagraphStyle(name='H2X', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=11, leading=15, textColor=navy, spaceBefore=7, spaceAfter=3))
styles.add(ParagraphStyle(name='BodyX', parent=styles['BodyText'], fontName='Helvetica', fontSize=9.5, leading=14, textColor=navy, spaceAfter=4))
styles.add(ParagraphStyle(name='SmallX', parent=styles['BodyText'], fontName='Helvetica', fontSize=8.5, leading=12, textColor=grey))

def bullets(items):
    return [Paragraph(f'- {item}', styles['BodyX']) for item in items]

def section(title, cards):
    story.append(Paragraph(title, styles['H1X']))
    for heading, text, points in cards:
        block = [Paragraph(heading, styles['H2X']), Paragraph(text, styles['BodyX'])] + bullets(points) + [Spacer(1, 5)]
        story.append(KeepTogether(block))

def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor('#DDD6FE')); canvas.line(18*mm, 13*mm, 192*mm, 13*mm)
    canvas.setFont('Helvetica', 8); canvas.setFillColor(grey)
    canvas.drawString(18*mm, 8*mm, 'Aparaitech IMS - LMS Functionality Update')
    canvas.drawRightString(192*mm, 8*mm, f'Page {doc.page}')
    canvas.restoreState()

doc = SimpleDocTemplate(str(out), pagesize=A4, rightMargin=18*mm, leftMargin=18*mm, topMargin=17*mm, bottomMargin=20*mm)
story = []
story += [Spacer(1, 18), Paragraph('IMS LMS Functionality Update', styles['TitleX']), Paragraph('Implemented modules, security controls, automated validation and remaining external setup', styles['SubX'])]

summary = [
    [Paragraph('<b>Area</b>', styles['BodyX']), Paragraph('<b>Current status</b>', styles['BodyX'])],
    ['Learning lifecycle', 'Catalog, free enrollment, paid checkout workflow, player progress and course certificates are implemented.'],
    ['Student operations', 'Tasks, projects, assessments, reviews, jobs, attendance, calendar, to-dos, tickets and notifications are available.'],
    ['Admin operations', 'Learning management, course sales, certificate issue flow, public inquiries and learning Excel export are available.'],
    ['Security and testing', 'Ownership and role-based access checks are implemented and regression-tested in an isolated database.'],
]
table = Table([[cell if isinstance(cell, Paragraph) else Paragraph(str(cell), styles['BodyX']) for cell in row] for row in summary], colWidths=[45*mm, 130*mm])
table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),violet),('TEXTCOLOR',(0,0),(-1,0),colors.white),('VALIGN',(0,0),(-1,-1),'TOP'),('GRID',(0,0),(-1,-1),0.35,colors.HexColor('#DDD6FE')),('BACKGROUND',(0,1),(-1,-1),colors.white),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white, soft_violet]),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7)]))
story += [table, Spacer(1, 16)]

section('1. Public Learning and Enrollment', [
    ('Public course catalog', 'Published courses are exposed without private lesson resources.', ['Search by course, skill and domain.', 'Domain, free/paid and trending filters.', 'Sort by newest, price and duration.', 'Price and discount display on catalog cards.']),
    ('Course detail and access', 'The course detail page protects non-preview lesson content.', ['Preview lessons remain visible to visitors.', 'Free courses enroll a logged-in student immediately.', 'Paid courses create a purchase record before access is granted.', 'Student continues learning from My Learning.']),
    ('Razorpay course workflow', 'A signed Razorpay verification path activates the enrollment only after successful payment.', ['Course purchases are tracked separately from project fees.', 'Course Sales screen shows paid and pending records.', 'Webhook handler receives the raw request body for signature validation.'])
])

section('2. Learning, Certificates and Student Workflows', [
    ('Learning player and progress', 'Admin-created modules and lessons are shown to enrolled students.', ['Lesson completion updates progress percentage.', 'Completion is recorded at 100%.', 'Admin can assign or revoke enrollment.', 'Enrollment list shows student progress and source.']),
    ('Certificate milestones', 'Project and learning certificate eligibility are calculated server-side.', ['Project milestones: 75% progress, 95% completion, 100% LOR.', 'Learning milestones: 75% progress and 100% completion.', 'Admin generates eligible certificates only.', 'Student page shows locked, eligible and issued states.']),
    ('Assessments, project review and job flow', 'Assessment history, project review and job application operations are implemented.', ['Assessment answers are graded server-side; correct answers are hidden before submit.', 'A student can review only an assigned project.', 'Job application unlocks only when assigned project progress reaches 100%.'])
])

story.append(PageBreak())
section('3. Admin, Support and Communication', [
    ('Admin learning operations', 'Admin controls course status, lessons, enrollment, price and discount.', ['Learning Courses and Course Editor pages.', 'Question bank, project review and job application screens.', 'Course Sales screen for purchase records.', 'Public inquiry inbox with status management.']),
    ('Support tickets and notifications', 'Support operations are scoped to the correct student.', ['Students see and reply only to their own tickets.', 'Admins can reply and resolve tickets.', 'Admin reply creates an in-app student notification.', 'Student reply creates in-app notifications for admins.', 'A user cannot mark another user notification as read.']),
    ('Operational email', 'Brevo API delivery support was added using configured mail settings.', ['A real delivery test was sent to the approved test inbox.', 'Email failures are handled without exposing secrets.', 'Certificate email will work after PDF upload storage is configured.'])
])

story.append(PageBreak())
section('4. Security and Automated Regression Testing', [
    ('Strict ownership checks', 'Access checks were hardened in project, team, task, ticket and notification routes.', ['Student cannot open another student project or team.', 'Student task list is limited to assigned tasks.', 'Team calendar access requires team membership.', 'Personal to-dos are bound to the signed-in user.']),
    ('Regression suite', 'A script creates its own test admin, students, teams, projects, tasks and course in an isolated MongoDB database.', ['Free enrollment and My Learning verification.', 'Project, team, task, ticket and notification denial checks.', 'Attendance check-in/out, calendar and to-do checks.', 'Assessment grading, review ownership, job unlock and admin-only route checks.', 'Test database is deleted after completion; live LMS data is not used.'])
])

section('5. Reporting and External Setup Remaining', [
    ('Learning Progress and Certificates Excel report', 'Admin Reports now has a real download for learning operations.', ['Student, course, domain and progress.', 'Enrollment source and paid amount.', '75% and completion certificate IDs.', 'Last updated timestamp.']),
    ('External configuration still required', 'These items need credentials or dashboard action and were intentionally not faked.', ['Cloudinary cloud name, API key and secret for live PDF certificate upload/download test.', 'Razorpay Dashboard webhook URL and a real payment test, currently deferred.', 'Legacy live LMS data export or database access for migration, currently deferred.', 'Landing-page visual work such as FAQ/testimonials/newsletter is being handled separately.'])
])

story += [Spacer(1, 8), Paragraph('Validation note: The core workflow regression suite passed after the latest changes. Paid Razorpay checkout and Cloudinary-backed certificate generation require their external production setup before live testing.', styles['SmallX'])]
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(out)
