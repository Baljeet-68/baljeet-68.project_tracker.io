<?php
/**
 * MODERN CAREERS PAGE - FULL FEATURED
 */

// 1. URLs
$BASE_API_URL = "https://mmfinfotech.website/Project_Tracker_Tool/server/api";
$INTERNAL_API_URL = "http://127.0.0.1:4000/Project_Tracker_Tool/server/api";

function apiRequest($endpoint, $method = 'GET', $data = null) {
    global $BASE_API_URL, $INTERNAL_API_URL;
    
    $urls = [$BASE_API_URL . $endpoint, $INTERNAL_API_URL . $endpoint];
    $lastResult = null;

    foreach ($urls as $url) {
        $options = [
            'http' => [
                'method'  => $method,
                'header'  => "Content-Type: application/json\r\n",
                'timeout' => 5,
                'ignore_errors' => true
            ]
        ];

        if ($data) {
            $options['http']['content'] = json_encode($data);
        }

        $context = stream_context_create($options);
        $response = @file_get_contents($url, false, $context);
        
        if ($response !== false) {
            $status_line = $http_response_header[0];
            preg_match('{HTTP\/\S*\s(\d{3})}', $status_line, $match);
            $status = $match[1];
            
            return [
                'data' => json_decode($response, true),
                'code' => (int)$status,
                'error' => ''
            ];
        }
    }

    return ['data' => null, 'code' => 0, 'error' => 'Connection failed'];
}

// Handle Application Submission
$message = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['apply_job'])) {
    $payload = [
        'jobId'       => $_POST['job_id'],
        'fullName'    => $_POST['full_name'],
        'email'       => $_POST['email'],
        'phone'       => $_POST['phone'],
        'coverLetter' => $_POST['cover_letter'],
        'resumeUrl'   => $_POST['resume_url'] // For now, taking a URL string
    ];

    $response = apiRequest('/public-apply', 'POST', $payload);
    
    if ($response['code'] === 201) {
        $message = '<div class="alert success">Application submitted successfully! Our HR team will contact you.</div>';
    } else {
        $message = '<div class="alert error">Failed to submit application. Please try again.</div>';
    }
}

// Fetch Jobs
$jobResponse = apiRequest('/public-jobs');
$jobs = ($jobResponse['code'] === 200 && is_array($jobResponse['data'])) ? $jobResponse['data'] : [];
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Careers | MMF Infotech</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #2563eb;
            --primary-hover: #1d4ed8;
            --bg: #f8fafc;
            --text: #1e293b;
            --text-light: #64748b;
            --card-bg: #ffffff;
            --border: #e2e8f0;
            --success: #22c55e;
            --error: #ef4444;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background-color: var(--bg); color: var(--text); line-height: 1.6; }
        
        .container { max-width: 1000px; margin: 0 auto; padding: 40px 20px; }
        
        header { text-align: center; margin-bottom: 50px; }
        header h1 { font-size: 2.5rem; color: var(--text); margin-bottom: 10px; font-weight: 700; }
        header p { color: var(--text-light); font-size: 1.1rem; }

        .alert { padding: 15px; border-radius: 8px; margin-bottom: 25px; text-align: center; font-weight: 500; }
        .alert.success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .alert.error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }

        .job-grid { display: grid; gap: 20px; }
        .job-card { 
            background: var(--card-bg); 
            border: 1px solid var(--border); 
            border-radius: 12px; 
            padding: 25px; 
            transition: transform 0.2s, box-shadow 0.2s;
            cursor: pointer;
        }
        .job-card:hover { transform: translateY(-3px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
        
        .job-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
        .job-title { font-size: 1.25rem; font-weight: 600; color: var(--primary); }
        .job-type { 
            font-size: 0.75rem; 
            text-transform: uppercase; 
            background: #dbeafe; 
            color: #1e40af; 
            padding: 4px 10px; 
            border-radius: 9999px; 
            font-weight: 600;
        }
        
        .job-meta { display: flex; gap: 15px; color: var(--text-light); font-size: 0.9rem; margin-bottom: 15px; }
        .job-meta span { display: flex; align-items: center; gap: 5px; }
        
        .job-desc { color: var(--text); font-size: 0.95rem; margin-bottom: 20px; }
        
        .apply-btn { 
            background: var(--primary); 
            color: white; 
            border: none; 
            padding: 10px 25px; 
            border-radius: 8px; 
            font-weight: 600; 
            cursor: pointer; 
            transition: background 0.2s;
        }
        .apply-btn:hover { background: var(--primary-hover); }

        /* Modal / Form Styles */
        .modal { 
            display: none; 
            position: fixed; 
            top: 0; left: 0; width: 100%; height: 100%; 
            background: rgba(0,0,0,0.5); 
            z-index: 1000; 
            align-items: center; 
            justify-content: center;
            padding: 20px;
        }
        .modal.active { display: flex; }
        
        .modal-content { 
            background: white; 
            padding: 35px; 
            border-radius: 16px; 
            width: 100%; 
            max-width: 600px; 
            position: relative; 
            max-height: 90vh; 
            overflow-y: auto;
        }
        
        .close-modal { 
            position: absolute; 
            top: 20px; right: 20px; 
            font-size: 24px; 
            cursor: pointer; 
            color: var(--text-light);
        }

        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; font-weight: 600; margin-bottom: 8px; font-size: 0.9rem; }
        .form-group input, .form-group textarea { 
            width: 100%; 
            padding: 12px; 
            border: 1px solid var(--border); 
            border-radius: 8px; 
            font-family: inherit;
            font-size: 1rem;
        }
        .form-group input:focus { outline: none; border-color: var(--primary); ring: 2px solid #bfdbfe; }
        
        .submit-btn { 
            width: 100%; 
            background: var(--primary); 
            color: white; 
            border: none; 
            padding: 14px; 
            border-radius: 8px; 
            font-weight: 700; 
            font-size: 1rem;
            cursor: pointer;
        }
        
        .empty-state { text-align: center; padding: 60px; color: var(--text-light); }

        @media (max-width: 640px) {
            header h1 { font-size: 2rem; }
            .job-header { flex-direction: column; gap: 10px; }
        }
    </style>
</head>
<body>

<div class="container">
    <header>
        <h1>Join Our Team</h1>
        <p>Explore current openings at MMF Infotech</p>
    </header>

    <?php echo $message; ?>

    <div class="job-grid">
        <?php if (empty($jobs)): ?>
            <div class="empty-state">
                <p>No active job openings at the moment. Please check back later.</p>
            </div>
        <?php else: ?>
            <?php foreach ($jobs as $job): ?>
                <div class="job-card" onclick="openApplyModal('<?php echo $job['id']; ?>', '<?php echo htmlspecialchars($job['title']); ?>')">
                    <div class="job-header">
                        <h2 class="job-title"><?php echo htmlspecialchars($job['title']); ?></h2>
                        <span class="job-type"><?php echo htmlspecialchars($job['type']); ?></span>
                    </div>
                    <div class="job-meta">
                        <span>📍 <?php echo htmlspecialchars($job['location']); ?></span>
                        <span>💰 <?php echo htmlspecialchars($job['salary'] ?? 'Competitive'); ?></span>
                    </div>
                    <div class="job-desc">
                        <?php 
                            // Clean HTML for preview
                            $clean_desc = strip_tags($job['description']);
                            echo (strlen($clean_desc) > 160) ? substr($clean_desc, 0, 160) . '...' : $clean_desc;
                        ?>
                    </div>
                    <button class="apply-btn">Quick Apply</button>
                </div>
            <?php endforeach; ?>
        <?php endif; ?>
    </div>
</div>

<!-- Application Modal -->
<div id="applyModal" class="modal">
    <div class="modal-content">
        <span class="close-modal" onclick="closeModal()">&times;</span>
        <h2 id="modalJobTitle" style="margin-bottom: 25px; color: var(--primary);">Apply for Job</h2>
        
        <form method="POST" action="">
            <input type="hidden" name="job_id" id="job_id">
            <input type="hidden" name="apply_job" value="1">
            
            <div class="form-group">
                <label>Full Name</label>
                <input type="text" name="full_name" required placeholder="John Doe">
            </div>
            
            <div class="form-group">
                <label>Email Address</label>
                <input type="email" name="email" required placeholder="john@example.com">
            </div>
            
            <div class="form-group">
                <label>Phone Number</label>
                <input type="text" name="phone" placeholder="+91 98765 43210">
            </div>

            <div class="form-group">
                <label>Resume Link (Google Drive/Dropbox)</label>
                <input type="url" name="resume_url" placeholder="https://drive.google.com/...">
            </div>
            
            <div class="form-group">
                <label>Cover Letter / Why should we hire you?</label>
                <textarea name="cover_letter" rows="4" placeholder="Tell us about your experience..."></textarea>
            </div>
            
            <button type="submit" class="submit-btn">Submit Application</button>
        </form>
    </div>
</div>

<script>
    function openApplyModal(id, title) {
        document.getElementById('job_id').value = id;
        document.getElementById('modalJobTitle').innerText = 'Apply for ' + title;
        document.getElementById('applyModal').classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scroll
    }

    function closeModal() {
        document.getElementById('applyModal').classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    // Close on outside click
    window.onclick = function(event) {
        let modal = document.getElementById('applyModal');
        if (event.target == modal) {
            closeModal();
        }
    }
</script>

</body>
</html>
