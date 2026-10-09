#!/usr/bin/env bash
set -euo pipefail
ISKRA_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ISKRA_TOOLS="${ISKRA_TOOLCHAIN:-$ISKRA_ROOT/.toolchain}"
ISKRA_BUILD="$ISKRA_ROOT/android/build"
ISKRA_BT="${ISKRA_BUILD_TOOLS:-$ISKRA_TOOLS/buildtools}"
ISKRA_PLATFORM="${ISKRA_ANDROID_JAR:-$ISKRA_TOOLS/platform/android.jar}"
missing=0
for tool in java javac keytool python3; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "Missing executable: $tool (install a full JDK 21 and Python 3)." >&2
    missing=1
  fi
done
for file in "$ISKRA_PLATFORM" "$ISKRA_BT/lib/d8.jar" "$ISKRA_BT/lib/apksigner.jar"; do
  if [[ ! -s "$file" ]]; then
    echo "Missing Android toolchain file: $file" >&2
    missing=1
  fi
done
for tool in aapt aapt2 zipalign; do
  if [[ ! -x "$ISKRA_BT/$tool" ]]; then
    echo "Missing or non-executable Android tool: $ISKRA_BT/$tool" >&2
    missing=1
  fi
done
if [[ "$missing" == 1 ]]; then
  echo 'In GitHub Actions check Install Android build tools. For a local build run python3 android/bootstrap.py.' >&2
  exit 1
fi
mkdir -p "$ISKRA_BUILD/classes" "$ISKRA_BUILD/dex" "$ISKRA_ROOT/dist"
javac --release 8 -encoding UTF-8 -proc:none -classpath "$ISKRA_PLATFORM" -d "$ISKRA_BUILD/classes" "$ISKRA_ROOT"/android/src/ru/iskra/frontier/*.java
python3 - "$ISKRA_BUILD" <<'PY'
from pathlib import Path
import sys,zipfile
build=Path(sys.argv[1])
with zipfile.ZipFile(build/'classes.jar','w',zipfile.ZIP_DEFLATED) as jar:
    for f in (build/'classes').rglob('*.class'): jar.write(f,f.relative_to(build/'classes'))
PY
java -cp "$ISKRA_BT/lib/d8.jar" com.android.tools.r8.D8 --min-api 24 --lib "$ISKRA_PLATFORM" --output "$ISKRA_BUILD/dex" "$ISKRA_BUILD/classes.jar"
"$ISKRA_BT/aapt2" compile --dir "$ISKRA_ROOT/android/res" -o "$ISKRA_BUILD/res.zip"
"$ISKRA_BT/aapt2" link -o "$ISKRA_BUILD/unsigned.apk" -I "$ISKRA_PLATFORM" --manifest "$ISKRA_ROOT/android/AndroidManifest.xml" --min-sdk-version 24 --target-sdk-version 35 -R "$ISKRA_BUILD/res.zip" -A "$ISKRA_ROOT/game"
python3 - "$ISKRA_BUILD" <<'PY'
from pathlib import Path
import sys,zipfile
build=Path(sys.argv[1])
with zipfile.ZipFile(build/'unsigned.apk','a',zipfile.ZIP_DEFLATED) as apk:
    for f in (build/'dex').glob('*.dex'): apk.write(f,f.name)
PY
"$ISKRA_BT/zipalign" -f 4 "$ISKRA_BUILD/unsigned.apk" "$ISKRA_BUILD/aligned.apk"
if [[ ! -f "$ISKRA_BUILD/alpha.keystore" ]]; then
  keytool -genkeypair -keystore "$ISKRA_BUILD/alpha.keystore" -alias iskra-alpha -keyalg RSA -keysize 2048 -validity 3650 -storepass iskra-local-alpha -keypass iskra-local-alpha -dname 'CN=Iskra Alpha,O=Independent Development,C=RU'
fi
java -jar "$ISKRA_BT/lib/apksigner.jar" sign --ks "$ISKRA_BUILD/alpha.keystore" --ks-key-alias iskra-alpha --ks-pass pass:iskra-local-alpha --key-pass pass:iskra-local-alpha --out "$ISKRA_ROOT/dist/Iskra-0.2.0.apk" "$ISKRA_BUILD/aligned.apk"
java -jar "$ISKRA_BT/lib/apksigner.jar" verify --verbose "$ISKRA_ROOT/dist/Iskra-0.2.0.apk"
"$ISKRA_BT/aapt" dump badging "$ISKRA_ROOT/dist/Iskra-0.2.0.apk"
echo "APK: $ISKRA_ROOT/dist/Iskra-0.2.0.apk"
