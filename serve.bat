@echo off
REM ---------------------------------------------------------------------------
REM  First Pass: Ticket Triage - local development server
REM
REM  Double-click this file, or run it from a command prompt.
REM
REM  It launches serve.ps1 with an execution-policy bypass for this one run, so
REM  it works on a machine where PowerShell scripts are otherwise blocked. It
REM  changes no system setting.
REM
REM  Arguments are passed through:   serve.bat -Port 8080
REM ---------------------------------------------------------------------------

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1" %*

REM Keep the window open if the server failed to start, so the error is readable
REM when this file was launched by double-clicking rather than from a prompt.
if errorlevel 1 (
  echo.
  echo The server did not start. See the message above.
  pause
)
