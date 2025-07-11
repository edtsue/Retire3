# Financial Planning Tool

A simple web-based financial planning calculator that helps you project your wealth growth over time.

## What it does:

- **Input your assets**: Enter amounts for Stocks, Cash/CD/Bonds, Retirement, and Insurance
- **Set growth rates**: Input Annual Rate of Return (ARR) for each category
- **Account for inflation**: Automatically adjusts returns for inflation
- **See projections**: View 1, 5, 10, 15, 20, and 25-year projections
- **Interactive chart**: Hover over points to see estimated annual income (4% rule)

## Features:

- **Preset buttons**: Conservative, Average, and Aggressive growth rates
- **Real-time updates**: Total assets update as you type
- **Input validation**: Warns about extreme values
- **Mobile-friendly**: Works on phones and tablets
- **Save/load**: Saves your plan to browser storage
- **Export options**: Download chart or share results

## How to use:

1. Enter your current age and expected inflation rate
2. Fill in your asset amounts and expected returns
3. Click "Project" to see the chart
4. Hover over the chart to see estimated retirement income
5. Use preset buttons for quick setup

## Files:

- `index.html` - The main webpage structure
- `styles.css` - Makes it look pretty and modern
- `script.js` - Makes it work (calculations, charts, etc.)
- `README.md` - This file

## To publish on GitHub:

1. Create a new repository on GitHub
2. Upload these files to your repository
3. Go to Settings > Pages
4. Select "Deploy from a branch"
5. Choose "main" branch and "/ (root)" folder
6. Your website will be available at: `https://yourusername.github.io/repositoryname`

## Keyboard shortcuts:

- `Ctrl + Enter` - Run projection

## Technical details:

- Uses Chart.js for the interactive chart
- Responsive design for mobile devices
- Local storage for saving plans
- Real-time calculations and validation 