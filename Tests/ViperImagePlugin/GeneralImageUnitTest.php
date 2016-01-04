<?php

require_once 'AbstractViperImagePluginUnitTest.php';

class Viper_Tests_ViperImagePlugin_GeneralImageUnitTest extends AbstractViperImagePluginUnitTest
{

    /**
     * Test that the image icon is available in different circumstances.
     *
     * @return void
     */
    public function testImageIconIsAvailable()
    {

        $this->useTest(1);
        $this->selectKeyword(1);
        $this->assertTrue($this->topToolbarButtonExists('image'), 'Image icon should be enabled.');

        $this->selectInlineToolbarLineageItem(0);
        $this->assertTrue($this->topToolbarButtonExists('image'), 'Image icon should be enabled.');

        $this->moveToKeyword(1);
        $this->assertTrue($this->topToolbarButtonExists('image'), 'Image icon should be enabled.');

        $this->moveToKeyword(2, 'right');
        $this->type('Key.ENTER');
        $this->assertTrue($this->topToolbarButtonExists('image'), 'Image icon should be enabled.');

    }//end testImageIconIsAvailable()


    /**
     * Test loading a new page with an image and starting a new paragraph after it.
     *
     * @return void
     */
    public function testStartingNewParagraphAfterImage()
    {
        $this->useTest(1);
        $this->selectKeyword(1);
        $this->selectInlineToolbarLineageItem(0);
        $this->sikuli->keyDown('Key.RIGHT');
        $this->sikuli->keyDown('Key.RIGHT');
        $this->sikuli->keyDown('Key.RIGHT');
        $this->sikuli->keyDown('Key.ENTER');
        $this->type('New paragraph');
        $this->assertHTMLMatch('<h1>Viper Image Test</h1><p>%1% XuT</p><p><img alt="" height="167" src="http://localhost/~slabs/Viper/Tests/ViperImagePlugin/Images/hero-shot.jpg" width="369" /></p><p>New paragraph</p><p>LABS is ORSM %2%</p>');

    }//end testStartingNewParagraphAfterImage()


    /**
     * Test toolbar icons when selecting an image.
     *
     * @return void
     */
    public function testToolbarImagesForImage()
    {
        $this->useTest(1);
        $this->clickElement('img', 0);

        // Check inline toolbar
        $this->assertTrue($this->inlineToolbarButtonExists('cssClass', NULL));
        $this->assertTrue($this->inlineToolbarButtonExists('link', NULL));
        $this->assertTrue($this->inlineToolbarButtonExists('anchorID', NULL));
        $this->assertTrue($this->inlineToolbarButtonExists('image', 'active'));
        $this->assertTrue($this->inlineToolbarButtonExists('move', NULL));

        // Check top toolbar
        $this->assertTrue($this->topToolbarButtonExists('bold', 'disabled'));
        $this->assertTrue($this->topToolbarButtonExists('italic', 'disabled'));
        $this->assertTrue($this->topToolbarButtonExists('subscript', 'disabled'));
        $this->assertTrue($this->topToolbarButtonExists('superscript', 'disabled'));
        $this->assertTrue($this->topToolbarButtonExists('strikethrough', 'disabled'));
        $this->assertTrue($this->topToolbarButtonExists('cssClass', NULL));
        $this->assertTrue($this->topToolbarButtonExists('removeFormat', 'disabled'));
        $this->assertTrue($this->topToolbarButtonExists('justifyLeft', NULL));
        $this->assertTrue($this->topToolbarButtonExists('formats', 'disabled'));
        $this->assertTrue($this->topToolbarButtonExists('headings', 'disabled'));
        $this->assertTrue($this->topToolbarButtonExists('listUL', 'disabled'));
        $this->assertTrue($this->topToolbarButtonExists('listOL', 'disabled'));
        $this->assertTrue($this->topToolbarButtonExists('listIndent', 'disabled'));
        $this->assertTrue($this->topToolbarButtonExists('listOutdent', 'disabled'));
        $this->assertTrue($this->topToolbarButtonExists('table', 'disabled'));
        $this->assertTrue($this->topToolbarButtonExists('image', 'active'));
        $this->assertTrue($this->topToolbarButtonExists('insertHr', 'disabled'));
        $this->assertTrue($this->topToolbarButtonExists('link', NULL));
        $this->assertTrue($this->topToolbarButtonExists('linkRemove', 'disabled'));
        $this->assertTrue($this->topToolbarButtonExists('anchorID', NULL));
        $this->assertTrue($this->topToolbarButtonExists('charmap', 'disabled'));
        $this->assertTrue($this->topToolbarButtonExists('searchReplace', NULL));
        $this->assertTrue($this->topToolbarButtonExists('langtools', NULL));
        $this->assertTrue($this->topToolbarButtonExists('accessAudit', NULL));
        $this->assertTrue($this->topToolbarButtonExists('sourceView', NULL));

    }//end testFormatIconIsDisabled()


     /**
     * Test selecting the image twice.
     *
     * @return void
     */
    public function testSelectingImageTwice()
    {
        $this->useTest(1);
        $this->clickElement('img', 0);
        $this->clickElement('img', 0);
        $this->assertTrue($this->inlineToolbarButtonExists('image', 'active'));
        $this->assertTrue($this->topToolbarButtonExists('image', 'active'));

    }//end testSelectingImageTwice()


     /**
     * Test required fields when adding an image.
     *
     * @return void
     */
    public function testRequiredFieldsWhenAddingAnImage()
    { 
        // Test fields in top toolbar
        $this->useTest(1);
        $this->moveToKeyword(1, 'left');
        $this->clicktopToolbarButton('image', NULL);
        $this->clickField('URL', true);
        $this->type('%url%/ViperImagePlugin/Images/hero-shot.jpg');
        sleep(1);
        $this->clickField('Alt', true);
        $this->type('test');
        sleep(1);
        $this->clicktopToolbarButton('Apply Changes', NULL, TRUE);
        $this->assertHTMLMatch('<h1>Viper Image Test</h1><p><img alt="test" src="http://localhost/~slabs/Viper/Tests/ViperImagePlugin/Images/hero-shot.jpg"  />%1% XuT</p><p><img alt="" height="167" src="http://localhost/~slabs/Viper/Tests/ViperImagePlugin/Images/hero-shot.jpg" width="369" /></p><p>LABS is ORSM %2%</p>');

    }//end testRequiredFieldsWhenModifiyingAnImage()


    /**
     * Test required fields when modifying an image.
     *
     * @return void
     */
    public function testRequiredFieldsWhenModifiyingAnImage()
    {
        // Test URL field in inline toolbar
        $this->useTest(1);
        $this->selectKeyword(1);
        sleep(1);
        $this->clickElement('img', 0);
        sleep(1);
        $this->clickinlineToolbarButton('image', 'active');
        $this->clearFieldValue('URL');
        sleep(1);
        $this->clickField('URL', true);
        $this->type('%url%/ViperImagePlugin/Images/hero-shot.jpg');
        $this->assertHTMLMatch('<h1>Viper Image Test</h1><p>%1% XuT</p><p><img src="%url%/ViperImagePlugin/Images/hero-shot.jpg" alt="" width="369" height="167" /></p><p>LABS is ORSM %2%</p>');

        // Test URL field in top toolbar
        $this->clicktopToolbarButton('image', 'active');
        $this->clearFieldValue('URL');
        sleep(1);
        $this->clickField('URL', true);
        $this->type('%url%/ViperImagePlugin/Images/hero-shot.jpg');
        $this->assertHTMLMatch('<h1>Viper Image Test</h1><p>%1% XuT</p><p><img src="%url%/ViperImagePlugin/Images/hero-shot.jpg" alt="" width="369" height="167" /></p><p>LABS is ORSM %2%</p>');

        // Test Alt field in inline toolbar
        $this->clickElement('img', 0);
        sleep(1);
        $this->clickinlineToolbarButton('image', 'active');
        $this->clickField('Image is decorative');
        $this->clickField('Alt', true);
        $this->type('test');
        $this->clickButton('Apply Changes', NULL, TRUE);
        $this->assertHTMLMatch('<h1>Viper Image Test</h1><p>%1% XuT</p><p><img src="%url%/ViperImagePlugin/Images/hero-shot.jpg" alt="test" width="369" height="167" /></p><p>LABS is ORSM %2%</p>');

        // Test Alt field in top toolbar
        $this->clickElement('img', 0);
        $this->clicktopToolbarButton('image', 'active');
        $this->clearFieldValue('Alt');
        $this->clickField('Alt', true);
        $this->type('TEST');
        $this->clickButton('Apply Changes', NULL, TRUE);
        $this->assertHTMLMatch('<h1>Viper Image Test</h1><p>%1% XuT</p><p><img src="%url%/ViperImagePlugin/Images/hero-shot.jpg" alt="TEST" width="369" height="167" /></p><p>LABS is ORSM %2%</p>');

    }//end testRequiredFieldsWhenModifiyingAnImage()


    /**
     * Test required fields when modifying an image.
     *
     * @return void
     */
    public function testAddingContentAroundImages()
    {
        // Test before image
        $this->useTest(1);
        $this->moveToKeyword(1, 'right');

        for ($i = 1; $i <= 5; $i++) {
            $this->sikuli->keyDown('Key.RIGHT');
        }

        $this->type('test ');
        $this->assertHTMLMatch('<h1>Viper Image Test</h1><p>%1% XuT</p><p>test <img src="%url%/ViperImagePlugin/Images/hero-shot.jpg" alt="" width="369" height="167" /></p><p>LABS is ORSM %2%</p>');
                 
        // Test after image
        $this->useTest(1);
        $this->moveToKeyword(1, 'right');

        for ($i = 1; $i <= 6; $i++) {
            $this->sikuli->keyDown('Key.RIGHT');
        }

        $this->type(' test');
        $this->assertHTMLMatch('<h1>Viper Image Test</h1><p>%1% XuT</p><p><img src="%url%/ViperImagePlugin/Images/hero-shot.jpg" alt="" width="369" height="167" /> test</p><p>LABS is ORSM %2%</p>');

    }//end testAddingContentAroundImages()


    /**
     * Test required fields when modifying an image.
     *
     * @return void
     */
    public function testRemovingContentAroundImages()
    {
        // Test content before image
        $this->useTest(2);
        $this->moveToKeyword(1, 'right');

        for ($i = 1; $i <= 5; $i++) {
            $this->sikuli->keyDown('Key.RIGHT');
        }

        for ($i = 1; $i <= 5; $i++) {
            $this->sikuli->keyDown('Key.BACKSPACE');
        }
        
        $this->assertHTMLMatch('<h1>Viper Image Test</h1><p>XuT %3%</p><p>%1%<img alt="" height="167" src="%url%/ViperImagePlugin/Images/hero-shot.jpg" width="369" /> test %2%</p><p>%4%LABS is ORSM</p>');
                
        // Test content after image
        $this->useTest(2);
        $this->moveToKeyword(2, 'left');

        for ($i = 1; $i <= 5; $i++) {
            $this->sikuli->keyDown('Key.LEFT');
        }

        for ($i = 1; $i <= 5; $i++) {
            $this->sikuli->keyDown('Key.DELETE');
        }

        $this->assertHTMLMatch('<h1>Viper Image Test</h1><p>XuT %3%</p><p>%1% test<img alt="" height="167" src="%url%/ViperImagePlugin/Images/hero-shot.jpg" width="369" /> %2%</p><p>%4%LABS is ORSM</p>');

        // Test paragraph before image
        $this->useTest(2);
        $this->selectKeyword(3);
        $this->selectInlineToolbarLineageItem(0);
        $this->sikuli->keyDown('Key.BACKSPACE');
        
        $this->assertHTMLMatch('<h1>Viper Image Test</h1><p>%1% test<img alt="" height="167" src="%url%/ViperImagePlugin/Images/hero-shot.jpg" width="369" /> test %2%</p><p>%4%LABS is ORSM</p>');
                
        // Test paragraph after image
        $this->useTest(2);
        $this->selectKeyword(4);
        $this->selectInlineToolbarLineageItem(0);
        $this->sikuli->keyDown('Key.DELETE');

        $this->assertHTMLMatch('<h1>Viper Image Test</h1><p>XuT %3%</p><p>%1% test<img alt="" height="167" src="%url%/ViperImagePlugin/Images/hero-shot.jpg" width="369" /> test %2%</p>');

    }//end testRemovingContentAroundImages()

}//end class

?>
