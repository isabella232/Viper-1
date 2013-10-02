<html>
<head>
    <style>
        body {
            background-color: #EEE;
            font-family: arial;
        }
        ul {
            list-style: none;
        }

        li {
            font-family: arial;
            font-size: 13px;
            padding: 2px 0;
        }


        .testName.error {
            color: rgb(192, 33, 33);
        }

        .testContent {
            display: none;
        }

        .testContent div {
            border: 1px solid;
            padding: 10px;
            border-radius: 5px;
            box-shadow: 0 0 10px 0 #666;
            background-color: #FEFEFE;
            margin: 10px 30px;
            display: inline-block;
            color: #000;
            cursor: auto;
            font-weight: normal;
        }

        .testName {
            padding: 4px 0;
        }

        .title {
            cursor: pointer;
        }

        .title:hover {
            color: #666;
        }

        .testName.visible .testContent {
            display: inline-block;
        }

        .toggleResults {
            background-color: #CCCCCC;
            border: 1px solid #666666;
            border-radius: 5px 5px 5px 5px;
            box-shadow: 0 0 2px 0 #000000 inset;
            cursor: pointer;
            display: inline-block;
            font-family: arial;
            font-weight: bold;
            margin-top: 10px;
            padding: 5px;
            text-shadow: 1px 1px 3px #AAAAAA;
            font-size: 12px;
        }

        .results {
            display: none;
        }

        .browser {
            margin-left: 25px;
        }

        .multiBrowserFail {
            font-weight: bold;
        }

    </style>
    <script type="text/javascript" src="../DfxJSLib/dfx.js"></script>
</head>
<body>
<?php

$testDir = dirname(__FILE__);
if (isset($_GET['path']) === TRUE) {
    $testDir = $_GET['path'];
}

$browsers = array(
             'googlechrome' => 'Google Chrome',
             'firefox'      => 'Firefox',
             'safari'       => 'Safari',
             'ie8'          => 'Internet Explorer 8',
             'ie9'          => 'Internet Explorer 9',
            );

// Read and print the test results for each browser.
$results        = array();
$commonFailures = array();

foreach ($browsers as $browserid => $browserName) {
    $resultDirs = array();

    // Get the list of files.
    $resultsPath = $testDir.'/tmp/'.$browserid.'/results';
    if (file_exists($resultsPath) === FALSE) {
        continue;
    }

    $handle = opendir($resultsPath);
    if ($handle === FALSE) {
        continue;
    }

    while (($fileName = readdir($handle)) !== FALSE) {
        if ($fileName !== '.' && $fileName !== '..') {
            $runDate = str_replace('_', ' ', $fileName);
            $runDate = str_replace('-', ':', $runDate);
            $runDate = strtotime($runDate);

            if (empty($runDate) === TRUE) {
                continue;
            }

            $resultDirs[$fileName] = $runDate;
        }
    }

    if (empty($resultDirs) === TRUE) {
        continue;
    }

    arsort($resultDirs);

    foreach ($resultDirs as $name => $time) {
        if (getResults($browserid, $resultsPath.'/'.$name, $time) === FALSE) {
            continue;
        }

        break;
    }

    closedir($handle);
}

printResults($results, $commonFailures, $browsers);

function printResults($results, $commonFailures, $browsers)
{
    $types = array('error', 'failure');

    foreach ($results as $browserid => $browserResults) {
        echo '<h2 id="'.$browserid.'">'.$browsers[$browserid].'</h2>';
        echo '<div class="browser">';
        echo '<div class="progressInfo">';
        echo $browserResults['progress'];
        echo '</div>';
        echo '<div class="toggleResults" onclick="dfx.toggle(dfx.getId(\''.$browserid.'-results\'));">Toggle Results</div>';

        unset($browserResults['progress']);
        echo '<ul id="'.$browserid.'-results" class="results">';

        foreach ($browserResults as $section => $secResults) {
            echo '<li>'.$section;
            echo '<ul>';

            foreach ($types as $type) {
                if (empty($secResults[$type]) === FALSE) {
                    foreach ($secResults[$type] as $name => $content) {
                        $testName     = $section.'::'.$name;
                        $testContent  = '<strong>Test:</strong> '.$testName."\n";
                        $testContent .= '<strong>Type:</strong> '.ucfirst($type)."\n";

                        if ($type === 'error') {
                            $ssURL = './tmp/'.$browserid.'/results/'.date('d_M_y_H-i', $browserResults['time']).'/'.$section.'/'.$type.'-'.$name.'.png';
                            $testContent .= '<a href="'.$ssURL.'" target="__blank">Screenshot</a>';
                        }

                        $failsInOtherBrowsersClass = '';

                        if (count($commonFailures[$testName]) > 1) {
                            $failsInOtherBrowsersClass = 'multiBrowserFail';
                            $testContent .= '<strong>Also Failing in:</strong> ';
                            $alsoFailing  = array();
                            foreach ($commonFailures[$testName] as $bid => $type) {
                                if ($bid === $browserid) {
                                    continue;
                                }

                                $alsoFailing[] = $browsers[$bid].' ('.$type.')';
                            }

                            $testContent .= implode(', ', $alsoFailing)."\n";
                        }

                        $testContent .= "\n----\n";
                        $testContent .= htmlentities($content);
                        $testContent  = nl2br($testContent);

                        echo '<li class="testName '.$type.' '.$failsInOtherBrowsersClass.'"><div class="title" onclick="dfx.toggleClass(this.parentNode, \'visible\')">'.$name.'</div>';
                        echo '<div class="testContent"><div>'.$testContent.'</div></div>';
                        echo '</li>';
                    }
                }
            }

            echo '</ul>';
            echo '</li>';
        }//end foreach

        echo '</ul>';
        echo '</div>';
    }//end foreach

}


function getResults($browserid, $path, $time)
{
    $handle = opendir($path);
    if ($handle === FALSE) {
        continue;
    }

    global $results;
    global $commonFailures;

    $progressContent = file_get_contents($path.'/progress.txt');
    $progressParts   = explode("\n", $progressContent);
    $numberOfTests   = (int) preg_replace('/[^\d]/', '', $progressParts[0]);
    if ($numberOfTests < 10) {
        return FALSE;
    }


    $progressContent = nl2br($progressContent);

    $results[$browserid] = array(
                            'progress' => $progressContent,
                            'time'     => $time,
                           );

    while (($fileName = readdir($handle)) !== FALSE) {
        if (strpos($fileName, '.') === 0 || $fileName === 'progress.txt') {
            continue;
        }

        $results[$browserid][$fileName] = array(
                               'error'    => array(),
                               'failure'  => array(),
                              );

        $subHandle = opendir($path.'/'.$fileName);
        if ($subHandle === FALSE) {
            continue;
        }

        while (($errFile = readdir($subHandle)) !== FALSE) {
            if ($errFile === '.' || $errFile === '..' || strpos($errFile, '.png') !== FALSE) {
                continue;
            }

            $fileParts = explode('-', $errFile);
            $type      = $fileParts[0];
            $testName  = str_replace('.txt', '', $fileParts[1]);

            $results[$browserid][$fileName][$type][$testName] = file_get_contents($path.'/'.$fileName.'/'.$errFile);

            if (isset($commonFailures[$fileName.'::'.$testName]) === FALSE) {
                $commonFailures[$fileName.'::'.$testName] = array();
            }

            $commonFailures[$fileName.'::'.$testName][$browserid] = $type;
        }

        closedir($subHandle);
    }

    closedir($handle);

    return TRUE;

}//end printResults()

?>
</body>
</html>