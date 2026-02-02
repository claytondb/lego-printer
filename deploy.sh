#!/bin/bash
# Deploy to GitHub Pages
npm run build
npx gh-pages -d dist
