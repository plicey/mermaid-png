@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Mermaid to PNG - Uninstallation
echo ========================================
echo.

:: Get the current directory
set "INSTALL_DIR=%~dp0"
:: Remove trailing backslash
if "%INSTALL_DIR:~-1%"=="\" set "INSTALL_DIR=%INSTALL_DIR:~0,-1%"

echo Uninstalling from: %INSTALL_DIR%
echo.

:: Check if in PATH
echo %PATH% | find /i "%INSTALL_DIR%" >nul
if %errorlevel% neq 0 (
    echo [INFO] This directory is not in your PATH.
    echo Nothing to uninstall.
    echo.
    pause
    exit /b 0
)

:: Show current PATH before removal
echo Current PATH (before removal):
for %%A in ("%PATH:;=" "%") do (
    echo   %%~A
)
echo.

:: Remove from PATH
echo Removing from User PATH environment variable...

:: Build new PATH without the install directory
set "NEW_PATH="
for %%A in ("%PATH:;=" "%") do (
    if /i not "%%~A"=="%INSTALL_DIR%" (
        if defined NEW_PATH (
            set "NEW_PATH=!NEW_PATH!;%%~A"
        ) else (
            set "NEW_PATH=%%~A"
        )
    )
)

:: Update PATH
setx PATH "!NEW_PATH!" >nul

if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] Uninstallation completed!
    echo.
    echo The directory has been removed from your User PATH.
    echo.
    echo IMPORTANT: You need to restart your terminal or log out/in
    echo for the changes to take effect.
    echo.
) else (
    echo.
    echo [ERROR] Failed to update PATH environment variable.
    echo.
    echo Possible reasons:
    echo   - Insufficient permissions
    echo   - PATH variable corruption
    echo.
    echo You can manually remove this directory from your PATH:
    echo   %INSTALL_DIR%
    echo.
)

pause
