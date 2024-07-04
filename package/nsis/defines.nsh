Unicode True

!define PRODUCT_NAME "PwManager"
!define PRODUCT_VERSION "${version}"
!define PRODUCT_PUBLISHER "PwManager"
!define PRODUCT_WEB_SITE "${homepage}"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
!define PRODUCT_UNINST_ROOT_KEY "HKLM"
!define PRODUCT_EXE "PwManager.exe"
!define PRODUCT_UNINST_TEMP_EXE "PwManagerUninst.exe"

!define MUI_ABORTWARNING
!define MUI_ICON "graphics\icon.ico"
!define MUI_FINISHPAGE_RUN "$INSTDIR\${PRODUCT_EXE}"

!define MULTIUSER_EXECUTIONLEVEL Highest
!define MULTIUSER_MUI
!define MULTIUSER_INSTALLMODE_COMMANDLINE

SetCompressor lzma
Name "${PRODUCT_NAME}"
OutFile "${output}"
InstallDir "$PROGRAMFILES\${PRODUCT_NAME}"
ShowInstDetails show
