import sys

# Read the entire file
with open('src/pages/EventPanel.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Make the 4 surgical edits
new_lines = []

for i, line in enumerate(lines):
    line_num = i + 1
    
    # Edit 1: Add import after line 10
    if line_num == 10 and 'import { Button }' in line:
        new_lines.append(line)
        new_lines.append('import { CourtesyModal } from "@/components/CourtesyModal";\n')
        continue
    
    # Edit 2: Add state after line 74 (after eventMenuOpen state)
    if line_num == 74 and 'eventMenuOpen' in line:
        new_lines.append(line)
        new_lines.append('  const [courtesyModalOpen, setCourtesyModalOpen] = React.useState(false);\n')
        continue
    
    # Edit 3: Replace QuickActionsCard at line 396
    if line_num == 396 and '<QuickActionsCard />' in line:
        indent = '                  '
        new_lines.append(f'{indent}<QuickActionsCard \n')
        new_lines.append(f'{indent}  onIssueCourtesy={{() => setCourtesyModalOpen(true)}}\n')
        new_lines.append(f'{indent}  onCopyLink={{copyLink}}\n')
        new_lines.append(f'{indent}  onOpenReport={{() => navigate(`/painel-evento/${{id}}/analytics`)}}\n')
        new_lines.append(f'{indent}  copyOk={{copyOk}}\n')
        new_lines.append(f'{indent}/>\n')
        continue
    
    # Edit 4: Add modal before line 476 (before </div> that closes main div)
    if line_num == 475 and '</OrganizerLayout>' in line:
        new_lines.append(line)
        new_lines.append('\n')
        new_lines.append('      <CourtesyModal\n')
        new_lines.append('        isOpen={courtesyModalOpen}\n')
        new_lines.append('        onClose={() => setCourtesyModalOpen(false)}\n')
        new_lines.append('        courtesyEmail={courtesyEmail}\n')
        new_lines.append('        setCourtesyEmail={setCourtesyEmail}\n')
        new_lines.append('        courtesyTicketTypeId={courtesyTicketTypeId}\n')
        new_lines.append('        setCourtesyTicketTypeId={setCourtesyTicketTypeId}\n')
        new_lines.append('        ticketTypes={ticketTypes}\n')
        new_lines.append('        emailInvalid={emailInvalid}\n')
        new_lines.append('        courtesyDisabled={courtesyDisabled}\n')
        new_lines.append('        courtesyLoading={courtesyLoading}\n')
        new_lines.append('        onSubmit={issueCourtesy}\n')
        new_lines.append('      />\n')
        continue
    
    # Keep all other lines as-is
    new_lines.append(line)

# Write back
with open('src/pages/EventPanel.tsx', 'w', encoding='utf-8', newline='') as f:
    f.writelines(new_lines)

print('✅ EventPanel.tsx updated successfully!')
print(f'Total lines: {len(lines)} → {len(new_lines)}')
