# 🧱 Lego Piece Printer

Load Lego designs, select the pieces you need, export as STL for 3D printing.

![Demo](demo.png)

## Features

- **Load LDraw files** (.ldr, .mpd, .dat) - the open standard for Lego CAD
- **Bill of materials** - see all pieces with colors and quantities
- **Select what you need** - deselect pieces you already have
- **3D preview** - visualize the parts
- **Export to STL** - print the pieces you need

## Usage

1. Open the app
2. Drop an LDraw file (or try a sample design)
3. Review the parts list
4. Uncheck pieces you already have
5. Click "Export STL"
6. Print on your 3D printer!

## Supported Formats

- `.ldr` - LDraw model file
- `.mpd` - Multi-part LDraw document
- `.dat` - LDraw part file

Create designs with:
- [BrickLink Studio 2.0](https://www.bricklink.com/v3/studio/download.page) (export as .ldr)
- [LeoCAD](https://www.leocad.org/)
- [LDCad](http://www.melkert.net/LDCad)

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

## LDraw

This project uses the [LDraw](https://www.ldraw.org/) parts library standard. LDraw is an open standard for Lego CAD programs that allows users to create virtual Lego models.

## 3D Printing Notes

- Default scale is 1:1 with real Lego dimensions
- Use 0.1-0.2mm layer height for best stud fit
- PLA or PETG work well
- Consider scaling up 2x for easier printing and handling
- Hollow parts save material (enabled by default)

## Part Dimensions

Standard Lego dimensions used:
- Stud diameter: 4.8mm
- Stud height: 1.8mm
- Brick height: 9.6mm (3 plates)
- Plate height: 3.2mm
- Unit size: 8.0mm (1 stud pitch)
- Wall thickness: 1.2mm

## License

MIT

## Credits

- [LDraw.org](https://www.ldraw.org/) - Parts library standard
- [Three.js](https://threejs.org/) - 3D visualization
