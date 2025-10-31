#!/bin/bash
# Create a simple placeholder icon using ImageMagick if available
# Otherwise, we'll skip icon creation for now

if command -v convert &> /dev/null; then
    echo "Creating placeholder icon..."
    convert -size 512x512 xc:none -fill "#4CAF50" -draw "circle 256,256 256,50" \
            -fill white -gravity center -pointsize 200 -annotate +0+0 "PA" \
            public/icon.png
    echo "Icon created!"
else
    echo "ImageMagick not available, skipping icon creation."
    echo "Icon will use default Electron icon."
fi
