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

:: Check if already in User PATH using PowerShell
powershell -Command "[Environment]::GetEnvironmentVariable('PATH', 'User')" | find /i "%INSTALL_DIR%" >nul
if %errorlevel% equ 0 (
    echo [WARNING] This directory is already in your User PATH.
    echo.
    set /p CONTINUE="Do you want to continue anyway? (Y/N): "
    if /i not "!CONTINUE!"=="Y" (
        echo Installation cancelled.
        pause
        exit /b 1
    )
)

:: Add to User PATH using PowerShell (handles long paths correctly)
echo.
echo Adding to User PATH environment variable...

powershell -Command "$userPath = [Environment]::GetEnvironmentVariable('PATH', 'User'); $installDir = '%INSTALL_DIR%'; if ($userPath -notlike \"*$installDir*\") { $newPath = if ($userPath -eq '') { $installDir } else { $userPath + ';' + $installDir }; [Environment]::SetEnvironmentVariable('PATH', $newPath, 'User'); exit 0 } else { exit 1 }"

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
    echo [INFO] Directory may already be in PATH or update not needed.
    echo.
)

pause
