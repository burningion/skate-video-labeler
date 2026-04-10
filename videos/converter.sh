for f in *.mov; do
  out="${f%.*}.mp4"
  [ -f "$out" ] && continue
  ffmpeg -i "$f" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
    -movflags +faststart -g 1 -keyint_min 1 -sc_threshold 0 \
    -x264opts "keyint=1:min-keyint=1:no-scenecut" -an "$out"
done
