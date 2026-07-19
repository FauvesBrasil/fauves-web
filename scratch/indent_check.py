import sys

with open(r"c:\Users\levyc\fauves-platform\src\pages\EventPanelV2.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx in range(594, 610):
    print(f"{idx+1}: {repr(lines[idx])}")
