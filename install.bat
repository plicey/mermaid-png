@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Mermaid to PNG - Installation
echo ========================================
echo.

:: Get the current directory
set "INSTALL_DIR=%~dp0"
:: Remove trailing backslash
if "%INSTALL_DIR:~-1%"=="\" set "INSTALL_DIR=%INSTALL_DIR:~0,-1%"

echo Installing from: %INSTALL_DIR%
echo.

:: Check if already in PATH
echo Current PATH:
for %%A in ("%PATH:;=" "%") do (
    echo   %%~A
)
echo.

:: Check if already installed
echo %PATH% | find /i "%INSTALL_DIR%" >nul
if %errorlevel% equ 0 (
    echo [WARNING] This directory is already in your PATH.
    echo.
    set /p CONTINUE="Do you want to continue anyway? (Y/N): "
    if /i not "!CONTINUE!"=="Y" (
        echo Installation cancelled.
        pause
        exit /b 1
    )
)

:: Add to User PATH (requires admin privileges for System PATH)
echo.
echo Adding to User PATH environment variable...
setx PATH "%PATH%;%INSTALL_DIR%" >nul

if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] Installation completed!
    echo.
    echo The directory has been added to your User PATH.
    echo.
    echo IMPORTANT: You need to restart your terminal or log out/in
    echo for the changes to take effect.
    echo.
    echo After restarting, you can use 'mmdpng' from anywhere:
    echo   mmdpng diagram.mmd
    echo   mmdpng diagram.mmd output.png --theme dark
    echo.
) else (
    echo.
    echo [ERROR] Failed to update PATH environment variable.
    echo.
    echo Possible reasons:
    echo   - Insufficient permissions
    echo   - PATH is too long (Windows has a limit)
    echo.
    echo You can manually add this directory to your PATH:
    echo   %INSTALL_DIR%
    echo.
)

pause
