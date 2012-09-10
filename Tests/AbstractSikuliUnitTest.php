<?php
require_once 'PHPUnit/Framework/TestCase.php';

/**
 * An abstract class that all Sikuli unit tests must extend.
 */
abstract class AbstractSikuliUnitTest extends PHPUnit_Framework_TestCase
{

    /**
     * Interactive Sikuli Jython session resouce handle.
     *
     * @var resource
     */
    private static $_sikuliHandle = NULL;

    /**
     * Sikuli input resource handle.
     *
     * @var resource
     */
    private static $_sikuliInput = NULL;

    /**
     * Sikuli output resource handle.
     *
     * @var resource
     */
    private static $_sikuliOutput = NULL;

    /**
     * Sikuli error resource handle.
     *
     * @var resource
     */
    private static $_sikuliError = NULL;

    /**
     * Number of variables created.
     *
     * @var resource
     */
    private static $_varCount = 0;

    /**
     * Set to TRUE when interactive Sikuli Jython session  is created.
     *
     * @var boolean
     */
    private static $_connected = FALSE;

    /**
     * Path to the sikuli app.
     *
     * @var string
     */
    private $_sikuliPath = '/Applications/Sikuli-IDE.app';

    /**
     * Name of the Operating System the PHP is running on.
     *
     * @var string
     */
    private static $_os = NULL;

    /**
     * Default region to use for find commands.
     *
     * @var string
     */
    private $_defaultRegion = NULL;

    /**
     * If TRUE then debugging output will be printed.
     *
     * @var boolean
     */
    private static $_debugging = FALSE;

    /**
     * Size of the sikuli.out file.
     *
     * @var integer
     */
    private static $_fileSize = NULL;

    /**
     * Last index that was returned from sikuli output.
     *
     * @var integer
     */
    private $_lastIndex = 0;


    /**
     * Setup test.
     *
     * @return void
     */
    protected function setUp()
    {
        if (getenv('VIPER_TEST_VERBOSE') === 'TRUE') {
            self::$_debugging = TRUE;
        }

        $this->connect();

    }//end setUp()


    /**
     * Clean up.
     *
     * @return void
     */
    protected function tearDown()
    {
        $this->disconnect();

        // DEBUG.
        ob_flush();

    }//end tearDown()


    protected function cleanUp()
    {
        // Cleans up variables.
        $cmd = 'del var_1';
        for ($i = 2; $i < self::$_varCount; $i++) {
            $cmd .= ', var_'.$i;
        }

        $this->sendCmd($cmd);

    }//end cleanUp()


    /**
     * Find a particular GUI element.
     *
     * @param string $ps         A Pattern object or Path to an image file or text.
     * @param string $region     Region or a Match object.
     * @param float  $similarity The similarity setting.
     *
     * @return string
     */
    protected function find($ps, $region=NULL, $similarity=NULL)
    {
        if ($region === NULL) {
            $region = $this->_defaultRegion;
        } else if ($region < 0) {
            $region = NULL;
        }

        if ($similarity !== NULL && file_exists($ps) === TRUE) {
            // If ps is not a file then ignore this setting.
            $pattern = $this->createPattern($ps);
            $pattern = $this->similar($pattern, $similarity);
            $ps      = $pattern;
        }

        $var = $this->callFunc('find', array($ps), $region, TRUE);
        return $var;

    }//end find()


    /**
     * Sets the auto timeout.
     *
     * @param float  $timeout The timeout in seconds.
     * @param string $region  Region object.
     *
     * @return void
     */
    protected function setAutoWaitTimeout($timeout, $region=NULL)
    {
        if ($region === NULL) {
            $region = $this->_defaultRegion;
        }

        $this->callFunc('setAutoWaitTimeout', array($timeout), $region);

    }//end setAutoWaitTimeout()


    /*
        Mouse & Keyboard
    */


    /**
     * Returns the location of the mouse pointer.
     *
     * @return string
     */
    protected function getMouseLocation()
    {
        return $this->callFunc('getMouseLocation', array(), 'Env', TRUE);

    }//end getMouseLocation()


    /**
     * Clicks the specified location.
     *
     * @param string $psmrl     A Pattern, String, Match, Region or Location.
     * @param string $modifiers One or more key modifiers.
     *
     * @return void
     */
    protected function click($psmrl, $modifiers=NULL)
    {
        $this->callFunc('click', array($psmrl, $modifiers), NULL, FALSE);

    }//end click()


    /**
     * Double clicks the specified location.
     *
     * @param string $psmrl     A Pattern, String, Match, Region or Location.
     * @param string $modifiers One or more key modifiers.
     *
     * @return void
     */
    protected function doubleClick($psmrl, $modifiers=NULL)
    {
        $this->callFunc('doubleClick', array($psmrl, $modifiers), NULL, FALSE);

    }//end doubleClick()


    /**
     * Right clicks the specified location.
     *
     * @param string $psmrl     A Pattern, String, Match, Region or Location.
     * @param string $modifiers One or more key modifiers.
     *
     * @return void
     */
    protected function rightClick($psmrl, $modifiers=NULL)
    {
        $this->callFunc('rightClick', array($psmrl, $modifiers), NULL, FALSE);

    }//end rightClick()


    /**
     * Perform a drag & drop from a start to end point.
     *
     * @param string $start The start PSMRL.
     * @param string $end   The end PSMRL.
     *
     * @return void
     */
    protected function dragDrop($start, $end)
    {
        $this->callFunc('dragDrop', array($start, $end));

    }//end dragDrop()


    /**
     * Move the mouse pointer to a location indicated by PSRML.
     *
     * @param string $psmrl A Pattern, String, Match, Region or Location.
     *
     * @return void
     */
    protected function mouseMove($psmrl)
    {
        $this->callFunc('mouseMove', array($psmrl));

    }//end mouseMove()


    /**
     * Move the mouse pointer by given X and Y offsets.
     *
     * @param integer $offsetX The X offset.
     * @param integer $offsetY The Y offset.
     *
     * @return void
     */
    protected function mouseMoveOffset($offsetX, $offsetY)
    {
        $mouseLocation = $this->getMouseLocation();
        $this->setLocation(
            $mouseLocation,
            $this->getX($mouseLocation) + $offsetX,
            $this->getY($mouseLocation) + $offsetY
        );
        $this->mouseMove($mouseLocation);

        return $mouseLocation;

    }//end mouseMoveOffset()


    /**
     * Returns a valid Sikuli key combination string.
     *
     * @param string $keysStr Keys combination.
     *
     * @return string
     */
    private function _extractKeys($keysStr)
    {
        if (empty($keysStr) === TRUE) {
            return NULL;
        }

        $str  = array();
        $keys = explode('+', $keysStr);
        foreach ($keys as $key) {
            $key = trim($key);
            if (strpos($key, 'Key.') === 0) {
                if ($key === 'Key.CMD' && $this->getOS() === 'windows') {
                    $key = 'Key.CTRL';
                }

                // Special key.
                $str[] = $key;
            } else {
                $str[] = '"'.$key.'"';
            }
        }

        $str = implode('+', $str);

        return $str;

    }//end _extractKeys()


    /**
     * Executes keyDown event.
     *
     * @param string  $keysStr  Keys to press.
     * @param boolean $holdDown If TRUE then keyUp() event will not be executed right
     *                          after keyDown.
     *
     * @return void
     */
    protected function keyDown($keysStr, $holdDown=FALSE)
    {
        $keys = $this->_extractKeys($keysStr);
        $this->callFunc('keyDown', array($keys, '_noQuotes' => TRUE));

        if ($holdDown === FALSE) {
            $this->callFunc('keyUp');
        }

    }//end keyDown()


    /**
     * Executes keyUp event.
     *
     * @param string $keysStr Keys to release, if none specified all keys are released.
     *
     * @return void
     */
    protected function keyUp($keysStr=NULL)
    {
        $keys = $this->_extractKeys($keysStr);
        $this->callFunc('keyUp', array($keys, '_noQuotes' => TRUE));

    }//end keyUp()


    /**
     * Pastes the given content.
     *
     * @param string $text The text to paste.
     *
     * @return void
     */
    protected function paste($text)
    {
        $this->callFunc('paste', array($text));

    }//end paste()


    /**
     * Returns the contents of the clipboard.
     *
     * @return string
     */
    protected function getClipboard()
    {
        return $this->callFunc('getClipboard', array(), 'Env');

    }//end getClipboard()


    /**
     * Extract the text contained in the region using OCR.
     *
     * @param string $region The region variable to use.
     *
     * @return string
     */
    protected function text($region=NULL)
    {
        return $this->callFunc('text', array(), $region);

    }//end text()


    /**
     * Type the text at the current focused input field or at a click point specified by PSMRL.
     *
     * @param string $text      The text to type.
     * @param string $modifiers Key modifiers.
     * @param string $psmrl     PSMRL variable.
     *
     * @return integer
     */
    protected function type($text, $modifiers=NULL, $psmrl=NULL)
    {
        $retval    = NULL;
        $modifiers = $this->_extractKeys($modifiers);
        if (is_numeric($text) === TRUE) {
            $text   = "'".$text."'";
            $retval = $this->callFunc('type', array($psmrl, $text, $modifiers, '_noQuotes' => TRUE));
        } else {
            $retval = $this->callFunc('type', array($psmrl, $text, $modifiers));
        }

        return $retval;

    }//end type()


    /*
        Pattern, Region, Location.
    */


    /**
     * Creates a Pattern object using the given image.
     *
     * @param string $image Path to the image.
     *
     * @return string
     * @throws Exception If the image does not exist.
     */
    protected function createPattern($image)
    {
        if (file_exists($image) === FALSE) {
            throw new Exception('Image does not exist: '.$image);
        }

        $var = $this->callFunc('Pattern', array($image), NULL, TRUE);
        return $var;

    }//end createPattern()


    /**
     * Creates a new Region object.
     *
     * @param integer $x The X position of the region.
     * @param integer $y The Y position of the region.
     * @param integer $w The width of the region.
     * @param integer $h The height of the region.
     *
     * @return string
     */
    protected function createRegion($x, $y, $w, $h)
    {
        $var = $this->callFunc('Region', array($x, $y, $w, $h), NULL, TRUE);
        return $var;

    }//end createRegion()


    /**
     * Creates a new Location object.
     *
     * @param integer $x The X position of the new location.
     * @param integer $y The Y position of the new location.
     *
     * @return string
     */
    protected function createLocation($x, $y)
    {
        $var = $this->callFunc('Location', array($x, $y), NULL, TRUE);
        return $var;

    }//end createLocation()


    /**
     * Sets the default region to use for find commands if not specified.
     *
     * @param string $region The region variable.
     *
     * @return void
     */
    protected function setDefaultRegion($region)
    {
        $this->_defaultRegion = $region;

    }//end setDefaultRegion()


    /**
     * Creates a new Pattern object with the specified minimum similarity set.
     *
     * @param string $patternObj The pattern variable.
     * @param float  $similarity The similarity value between 0 and 1.
     *
     * @return string
     */
    protected function similar($patternObj, $similarity=0.7)
    {
        if ($similarity === NULL) {
            $similarity = 0.7;
        }

        $var = $this->callFunc('similar', array($similarity), $patternObj, TRUE);
        return $var;

    }//end similar()


    /**
     * Sets the region's X attribute.
     *
     * @param string  $obj The region object.
     * @param integer $val The new value.
     *
     * @return void
     */
    protected function setX($obj, $val)
    {
        $ret = NULL;
        $this->callFunc('setX', array($val), $obj);

    }//end setX()


    /**
     * Sets the region's Y attribute.
     *
     * @param string  $obj The region object.
     * @param integer $val The new value.
     *
     * @return void
     */
    protected function setY($obj, $val)
    {
        $this->callFunc('setY', array($val), $obj);

    }//end setY()


    /**
     * Sets the region's W attribute.
     *
     * @param string  $obj The region object.
     * @param integer $val The new value.
     *
     * @return void
     */
    protected function setW($obj, $val)
    {
        $this->callFunc('setW', array($val), $obj);

    }//end setW()


    /**
     * Sets the region's H attribute.
     *
     * @param string  $obj The region object.
     * @param integer $val The new value.
     *
     * @return void
     */
    protected function setH($obj, $val)
    {
        $this->callFunc('setH', array($val), $obj);

    }//end setH()


    /**
     * Returns the region's X attribute.
     *
     * @param string $obj The region object.
     *
     * @return integer
     */
    protected function getX($obj)
    {
        $ret = (int) $this->callFunc('getX', array(), $obj);
        return $ret;

    }//end getX()


    /**
     * Returns the region's Y attribute.
     *
     * @param string $obj The region object.
     *
     * @return integer
     */
    protected function getY($obj)
    {
        $ret = (int) $this->callFunc('getY', array(), $obj);
        return $ret;

    }//end getY()


    /**
     * Returns the region's W attribute.
     *
     * @param string $obj The region object.
     *
     * @return integer
     */
    protected function getW($obj)
    {
        $ret = (int) $this->callFunc('getW', array(), $obj);
        return $ret;

    }//end getW()


    /**
     * Returns the region's H attribute.
     *
     * @param string $obj The region object.
     *
     * @return integer
     */
    protected function getH($obj)
    {
        $ret = (int) $this->callFunc('getH', array(), $obj);
        return $ret;

    }//end getH()


    /**
     * Returns the top left location.
     *
     * @param string $obj The region object.
     *
     * @return Location
     */
    protected function getTopLeft($obj)
    {
        $loc = $this->callFunc('getTopLeft', array(), $obj, TRUE);
        return $loc;

    }//end getTopLeft()


    /**
     * Returns the top right location.
     *
     * @param string $obj The region object.
     *
     * @return Location
     */
    protected function getTopRight($obj)
    {
        $loc = $this->callFunc('getTopRight', array(), $obj, TRUE);
        return $loc;

    }//end getTopRight()


    /**
     * Returns the bottom left location.
     *
     * @param string $obj The region object.
     *
     * @return Location
     */
    protected function getBottomLeft($obj)
    {
        $loc = $this->callFunc('getBottomLeft', array(), $obj, TRUE);
        return $loc;

    }//end getBottomLeft()


    /**
     * Returns the bottom right location.
     *
     * @param string $obj The region object.
     *
     * @return Location
     */
    protected function getBottomRight($obj)
    {
        $loc = $this->callFunc('getBottomRight', array(), $obj, TRUE);
        return $loc;

    }//end getBottomRight()


    /**
     * Returns the center location.
     *
     * @param string $obj The region object.
     *
     * @return Location
     */
    protected function getCenter($obj)
    {
        $loc = $this->callFunc('getCenter', array(), $obj, TRUE);
        return $loc;

    }//end getCenter()


    /**
     * Extends the given region to the right.
     *
     * @param string  $obj   The region object.
     * @param integer $range Number of pixels to extend by.
     *
     * @return Region
     */
    protected function extendRight($obj, $range=NULL)
    {
        return $this->callFunc('right', array($range), $obj, TRUE);

    }//end extendRight()


    /**
     * Sets the location of a Location object.
     *
     * @param string  $locObj The Location object var name.
     * @param integer $x      The new X position.
     * @param integer $y      The new Y position.
     *
     * @return string
     */
    protected function setLocation($locObj, $x, $y)
    {
        $loc = $this->callFunc('setLocation', array($x, $y), $locObj);
        return $loc;

    }//end setLocation()


    /**
     * Captures the given region and returns the created image path.
     *
     * @param string $obj The region object.
     *
     * @return string
     */
    protected function capture($obj)
    {
        $imagePath = $this->callFunc('capture', array($obj));
        $imagePath = str_replace('u\'', '', $imagePath);
        $imagePath = trim($imagePath, '\'');

        return $imagePath;

    }//end capture()


    /**
     * Sets a Sikuli setting.
     *
     * @param string $setting Name of the setting.
     * @param string $value   Value of the setting.
     *
     * @return void
     */
    protected function setSetting($setting, $value)
    {
        $this->sendCmd('Settings.'.$setting.' = '.$value);
        $this->_getStreamOutput();

    }//end setSetting()


    /*
        Tests.
    */


    /**
     * Checks that given pattern exists on the screen or specified region.
     *
     * @param string  $ps      The pattern or text.
     * @param string  $obj     The region object.
     * @param integer $seconds The number of seconds to wait.
     *
     * @return boolean
     */
    protected function exists($ps, $obj=NULL, $seconds=NULL)
    {
        if ($obj === NULL) {
            $obj = $this->_defaultRegion;
        }

        $ret = $this->callFunc('exists', array($ps, $seconds), $obj);
        if (strpos($ret, 'Match[') === 0) {
            return TRUE;
        }

        return FALSE;

    }//end exists()


    /**
     * Switches to the specifed application.
     *
     * @param string $name The name of the application to switch to.
     *
     * @return string
     */
    protected function switchApp($name)
    {
        if ($this->getOS() === 'windows') {
            $app = $this->callFunc('switchApp', array($name), NULL, TRUE);
            sleep(2);
            return $this->callFunc('App.focusedWindow', array(), NULL, TRUE);
        } else {
            $app = $this->callFunc('App', array($name), NULL, TRUE);
            return $this->callFunc('focus', array(), $app, TRUE);
        }

    }//end switchApp()


    /**
     * Print the given string.
     *
     * @param string $str The string to print.
     *
     * @return void
     */
    protected function printVar($str)
    {
        echo $this->sendCmd('print '.$str);

    }//end printVar()


    /**
     * Highlights the specified region for given seconds.
     *
     * @param string  $region  The region variable.
     * @param integer $seconds The number of seconds to highlight.
     *
     * @return void
     */
    protected function highlight($region=NULL, $seconds=1)
    {
        if ($region === NULL) {
            $region = $this->_defaultRegion;
        }

        $this->callFunc('highlight', array($seconds), $region);

    }//end highlight()


    /**
     * Exit Sikuli.
     *
     * @return void
     */
    protected function close()
    {
        fwrite(self::$_sikuliInput, 'exit()'."\n");

    }//end close()


    /**
     * Calls the specified function.
     *
     * If $assignToVar is set to TRUE then the return value will be the name of the
     * new variable, if FALSE then return value will be the output of the function.
     *
     * @param string  $name        The name of the function to call.
     * @param array   $args        The array of arguments to pass to the function.
     * @param string  $obj         The object to use when calling the function.
     * @param boolean $assignToVar If TRUE then the return value of the function is
     *                             assigned to a new variable.
     *
     * @return string
     */
    protected function callFunc($name, array $args=array(), $obj=NULL, $assignToVar=FALSE)
    {
        $command = '';
        $var     = NULL;
        if ($assignToVar === TRUE) {
            $var     = 'var_'.(++self::$_varCount);
            $command = $var.' = ';
        }

        if ($obj !== NULL) {
            $command .= $obj.'.';
        }

        $command .= $name.'(';

        $addQuotes = TRUE;
        if (isset($args['_noQuotes']) === TRUE) {
            unset($args['_noQuotes']);
            $addQuotes = FALSE;
        }

        $cmdArgs = array();
        foreach ($args as $arg) {
            if ($arg === NULL) {
                continue;
            }

            if ($addQuotes === FALSE
                || is_numeric($arg) === TRUE
                || strpos($arg, 'var_') === 0
                || strpos($arg, 'Key.') === 0
            ) {
                $cmdArgs[] = $arg;
            } else {
                $cmdArgs[] = "'".$arg."'";
            }
        }

        $command .= implode(', ', $cmdArgs);

        $command .= ')';

        $output = $this->sendCmd($command);

        if ($this->getOS() !== 'windows') {
            $output = $this->_getStreamOutput();
        }

        if ($assignToVar === FALSE) {
            return $output;
        }

        return $var;

    }//end callFunc()


    /**
     * Executes the given command.
     *
     * @param string $command The command to execute.
     *
     * @return string
     */
    protected function sendCmd($command)
    {
        $this->debug('CMD>>> '.$command);

        if ($this->getOS() === 'windows') {
            $filePath  = dirname(__FILE__).'/sikuli.out';
            file_put_contents($filePath, '');
        }

        // This will allow _getStreamOutput method to stop waiting for more data.
        $command .= ";print '>>>';\n";
        fwrite(self::$_sikuliInput, $command);

        if ($this->getOS() === 'windows') {
            return $this->_getStreamOutput();
        }

    }//end sendCmd()


    /**
     * Creates an interactive Sikuli Jython session from command line.
     *
     * @return void
     * @throws Exception If cannot connect to Sikuli.
     */
    protected function connect()
    {
        if (self::$_connected === TRUE) {
            return;
        }

        self::$_varCount = 0;

        if ($this->getOS() === 'windows') {
            $cmd     = 'start "Viper" /B "C:\Program Files\Java\jre7\bin\java.exe" -jar "C:\Program Files\Sikuli X\sikuli-script.jar" -i';
            $process = popen($cmd, 'w');
            if (is_resource($process) === FALSE) {
                throw new Exception('Failed to connect to Sikuli');
            }

            $sikuliOutputFile = dirname(__FILE__).'/sikuli.out';
            file_put_contents($sikuliOutputFile, '');
            $sikuliOut = fopen($sikuliOutputFile, 'r');

            self::$_fileSize = filesize($sikuliOutputFile);

            self::$_sikuliHandle = $process;
            self::$_sikuliInput  = $process;
            self::$_sikuliOutput = $sikuliOut;

            // Redirect Sikuli output to a file.
            $this->sendCmd('sys.stdout = sys.stderr = open("'.$sikuliOutputFile.'", "w", 1000)');
        } else {
            $cmd = '/usr/bin/java -jar '.$this->_sikuliPath.'/Contents/Resources/Java/sikuli-script.jar -i';
            $descriptorspec = array(
                               0 => array(
                                     'pipe',
                                     'r',
                                    ),
                               1 => array(
                                     'pipe',
                                     'w',
                                    ),
                               2 => array(
                                     'pipe',
                                     'w',
                                    ),
                              );

            $pipes   = array();
            $process = proc_open($cmd, $descriptorspec, $pipes);

            if (is_resource($process) === FALSE) {
                throw new Exception('Failed to connect to Sikuli');
            }

            self::$_sikuliHandle = $process;
            self::$_sikuliInput  = $pipes[0];
            self::$_sikuliOutput = $pipes[1];
            self::$_sikuliError  = $pipes[2];

            // Dont block reads.
            stream_set_blocking(self::$_sikuliOutput, 0);
            stream_set_blocking(self::$_sikuliError, 0);

            $this->_getStreamOutput();
        }//end if

        self::$_connected = TRUE;

    }//end connect()


    /**
     * Exists the interactive Sikuli Jython session.
     *
     * @return void
     */
    protected function disconnect()
    {
        $this->close();

        fclose(self::$_sikuliOutput);
        fclose(self::$_sikuliInput);
        fclose(self::$_sikuliError);
        proc_close(self::$_sikuliHandle);

        self::$_connected = FALSE;

    }//end disconnect()


    /**
     * Returns the name of the Operating System the PHP is running on.
     *
     * @return string
     */
    protected function getOS()
    {
        if (self::$_os === NULL) {
            $os = strtolower(php_uname('s'));
            switch ($os) {
                case 'darwin':
                    self::$_os = 'osx';
                break;

                case 'linux':
                    self::$_os = 'linux';
                break;

                case 'windows nt':
                    self::$_os = 'windows';
                break;

                default:
                    self::$_os = $os;
                break;
            }//end switch
        }

        return self::$_os;

    }//end getOS()


    /**
     * Returns the output from interactive Sikuli Jython session (Windows only).
     *
     * This method is used to get the output from Sikuli due to a PHP bug with
     * streams on Windows OS.
     *
     * @return string
     * @throws Exception If Sikuli server does not respond in time.
     */
    private function _getStreamOutputWindows()
    {
        $startTime = microtime(TRUE);
        $timeout   = 10;
        $filePath  = dirname(__FILE__).'/sikuli.out';

        while (TRUE) {
            $contents = trim(file_get_contents($filePath));
            if ($contents !== '') {
                $startTime = microtime(TRUE);

                if (strpos($contents, 'File "<stdin>"') !== FALSE) {
                    $contents = str_replace("print '>>>';", '', $contents);
                    throw new Exception('Sikuli Error:'."\n".$contents);
                }

                $contents = trim(str_replace('>>>', '', $contents));
                return $contents;
            }

            if ((microtime(TRUE) - $startTime) > $timeout) {
                throw new Exception('Sikuli server did not respond');
            }

            usleep(50000);
        }//end while

    }//end _getStreamOutputWindows()


    /**
     * Returns the output from interactive Sikuli Jython session.
     *
     * @return string
     * @throws Exception If Sikuli server does not respond in time.
     */
    private function _getStreamOutput()
    {
        if ($this->getOS() === 'windows') {
            return $this->_getStreamOutputWindows();
        }

        $isError = FALSE;
        $timeout = 10;
        $content = array();
        $start   = microtime(TRUE);

        while (TRUE) {
            $read    = array(
                        self::$_sikuliOutput,
                        self::$_sikuliError,
                       );
            $write   = array();
            $except  = NULL;
            $changed = stream_select($read, $write, $except, 0, 100000);
            if ($changed !== FALSE && $changed > 0) {
                $lines = array();
                $lines = explode("\n", stream_get_contents($read[0]));
                if ($isError === FALSE && $read[0] === self::$_sikuliError) {
                    $content = array();
                    $isError = TRUE;
                }

                foreach ($lines as $line) {
                    if (strlen($line) > 0) {
                        if ($line === '>>>' || $line === '[info] VDictProxy loaded.') {
                            break(2);
                        }

                        if (strpos($line, 'Using substitute bounding box at') === 0) {
                            $isError = FALSE;
                            continue;
                        }

                        // DEBUG.
                        //var_dump($line);@ob_flush();

                        $start     = microtime(TRUE);
                        $content[] = $line;

                        if ($isError === TRUE
                            && (preg_match('/  Line \d+, in file <stdin>/i', $line) === 1
                            || preg_match('/File "<stdin>", line \d+/i', $line) === 1)
                        ) {
                            $timeout = 1;
                        }
                    }//end if
                }//end foreach

                if ($isError === TRUE && empty($content) === TRUE) {
                    $isError = FALSE;
                }
            }//end if

            if (ob_get_level() > 0) {
                ob_flush();
            }

            if ((microtime(TRUE) - $start) > $timeout) {
                if ($isError === TRUE) {
                    break;
                } else {
                    $this->debug('Exception: Sikuli server did not respond');
                    throw new Exception('Sikuli server did not respond');
                }
            }
        }//end while

        $content = implode("\n", $content);

        if ($isError === TRUE) {
            $this->debug("Sikuli ERROR: \n".$content);
            throw new Exception("Sikuli ERROR: \n".$content);
        }

        $this->debug($content);

        return $content;

    }//end _getStreamOutput()


    /**
     * Prints debug output if debugging is enabled.
     *
     * @param string $content The content to print.
     *
     * @return void
     */
    protected function debug($content)
    {
        if (self::$_debugging === TRUE && trim($content) !== '') {
            echo trim($content)."\n";
            @ob_flush();
        }

    }//end debug()


}//end class

?>
