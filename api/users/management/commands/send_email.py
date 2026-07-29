import os
from django.core.management.base import BaseCommand, CommandError
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings

EMAILS_DIR = os.path.join(settings.BASE_DIR, 'emails')


class Command(BaseCommand):
    help = (
        'Send an HTML email using a template from the emails/ folder via Amazon SES.\n\n'
        'Examples:\n'
        '  python manage.py send_email welcome --subject "Bienvenido" --to user@example.com\n'
        '  python manage.py send_email newsletter --subject "Novedades" --all-verified --dry-run\n'
        '  python manage.py send_email newsletter --subject "Novedades" --all-verified\n'
        '  python manage.py send_email welcome --subject "Test" --test me@example.com\n'
        '  python manage.py send_email --list'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            'email_file',
            nargs='?',
            help='Name of the HTML file in emails/ folder (without .html extension)',
        )
        parser.add_argument(
            '--subject', '-s',
            help='Email subject line',
        )
        parser.add_argument(
            '--to', '-t',
            nargs='+',
            metavar='EMAIL',
            help='Recipient email address(es)',
        )
        parser.add_argument(
            '--test',
            metavar='EMAIL',
            help='Send only to this address (ignores --to), useful for previewing',
        )
        parser.add_argument(
            '--all-verified',
            action='store_true',
            help='Send to all users with a verified email address',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show recipients without actually sending',
        )
        parser.add_argument(
            '--list', '-l',
            action='store_true',
            help='List available email templates in emails/ folder',
        )

    def handle(self, *args, **options):
        if options['list']:
            self._list_emails()
            return

        email_file = options.get('email_file')
        if not email_file:
            raise CommandError('Provide an email file name or use --list to see available templates.')

        subject = options.get('subject')
        if not subject:
            raise CommandError('--subject is required.')

        if options.get('test'):
            recipients = [options['test']]
        elif options.get('all_verified'):
            from allauth.account.models import EmailAddress
            recipients = list(
                EmailAddress.objects.filter(verified=True).values_list('email', flat=True)
            )
        else:
            recipients = options.get('to') or []

        if not recipients:
            raise CommandError('Provide recipients with --to, --all-verified, or use --test <email>.')

        html_path = os.path.join(EMAILS_DIR, f'{email_file}.html')
        if not os.path.isfile(html_path):
            available = self._available_files()
            raise CommandError(
                f'File not found: emails/{email_file}.html\n'
                f'Available: {", ".join(available) if available else "(none)"}'
            )

        with open(html_path, 'r', encoding='utf-8') as f:
            raw_html = f.read()

        html_body = render_to_string('email/base_custom.html', {'custom_content': raw_html})

        from_email = settings.DEFAULT_FROM_EMAIL
        dry_run = options.get('dry_run')
        mode = 'DRY-RUN' if dry_run else ('TEST' if options.get('test') else 'SEND')

        self.stdout.write(f'[{mode}] Subject:    {subject}')
        self.stdout.write(f'[{mode}] From:       {from_email}')
        self.stdout.write(f'[{mode}] Recipients: {len(recipients)}')

        if dry_run:
            for email in recipients:
                self.stdout.write(f'  - {email}')
            self.stdout.write(self.style.WARNING('Dry run — no emails sent.'))
            return

        sent = 0
        failed = 0
        for email in recipients:
            try:
                msg = EmailMultiAlternatives(
                    subject=subject,
                    body=f'{subject}\n\nVer versión HTML.',
                    from_email=from_email,
                    to=[email],
                )
                msg.attach_alternative(html_body, 'text/html')
                msg.send(fail_silently=False)
                sent += 1
                self.stdout.write(f'  OK  {email}')
            except Exception as e:
                failed += 1
                self.stdout.write(self.style.ERROR(f'  FAIL {email}: {e}'))

        self.stdout.write(self.style.SUCCESS(f'Done — sent: {sent}, failed: {failed}.'))

    def _available_files(self):
        if not os.path.isdir(EMAILS_DIR):
            return []
        return [f[:-5] for f in os.listdir(EMAILS_DIR) if f.endswith('.html')]

    def _list_emails(self):
        files = self._available_files()
        if not files:
            self.stdout.write('No email templates found in emails/ folder.')
            return
        self.stdout.write(self.style.SUCCESS(f'{len(files)} template(s) in emails/:'))
        for name in sorted(files):
            self.stdout.write(f'  - {name}')
