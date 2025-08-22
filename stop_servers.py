"""
Helper script to stop Mystery Shop servers running on common ports.
This will find and terminate any servers running on ports 8000-8010.
"""
import subprocess
import sys
import time


def find_process_on_port(port):
    """Find process ID running on a specific port."""
    try:
        if sys.platform == "win32":
            # Windows
            result = subprocess.run(
                ["netstat", "-ano"], 
                capture_output=True, 
                text=True, 
                check=True
            )
            for line in result.stdout.split('\n'):
                if f':{port}' in line and 'LISTENING' in line:
                    parts = line.split()
                    if parts:
                        return parts[-1]  # Last column is PID
        else:
            # Linux/Mac
            result = subprocess.run(
                ["lsof", "-ti", f":{port}"], 
                capture_output=True, 
                text=True
            )
            if result.returncode == 0 and result.stdout.strip():
                return result.stdout.strip().split('\n')[0]
    except Exception:
        pass
    return None


def kill_process(pid):
    """Kill a process by PID."""
    try:
        if sys.platform == "win32":
            subprocess.run(["taskkill", "/PID", pid, "/F"], check=True)
        else:
            subprocess.run(["kill", "-9", pid], check=True)
        return True
    except Exception:
        return False


def main():
    print("Searching for Mystery Shop servers on ports 8000-8010...")
    found_servers = False
    
    for port in range(8000, 8011):
        pid = find_process_on_port(port)
        if pid:
            print(f"Found server on port {port} (PID: {pid})")
            if kill_process(pid):
                print(f"Successfully stopped server on port {port}")
                found_servers = True
            else:
                print(f"Failed to stop server on port {port}")
        else:
            continue
    
    if not found_servers:
        print("No Mystery Shop servers found running")
    else:
        print("\nCleanup complete!")
        
    # Also check for any python processes that might be related
    print("\nChecking for related Python processes...")
    try:
        if sys.platform == "win32":
            result = subprocess.run(
                ["tasklist", "/FI", "IMAGENAME eq python.exe"], 
                capture_output=True, 
                text=True
            )
            if "python.exe" in result.stdout:
                print("Found Python processes - some might be related servers:")
                print("   Run 'tasklist | findstr python' to see details")
                print("   Use Ctrl+C in server terminals to stop them properly")
        else:
            result = subprocess.run(
                ["ps", "aux"], 
                capture_output=True, 
                text=True
            )
            python_processes = [line for line in result.stdout.split('\n') if 'python' in line.lower()]
            if python_processes:
                print("Found Python processes - some might be related servers")
    except Exception:
        pass


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nInterrupted by user")
    except Exception as e:
        print(f"ERROR: {e}")
