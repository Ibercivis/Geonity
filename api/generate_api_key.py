#!/usr/bin/env python3
import secrets
import argparse

parser = argparse.ArgumentParser(description='Generate a secure API key')
parser.add_argument('--prefix', default='', help='Optional prefix (e.g. mobile, web)')
args = parser.parse_args()

key = secrets.token_urlsafe(32)
if args.prefix:
    print(f"{args.prefix}-{key}")
else:
    print(key)
