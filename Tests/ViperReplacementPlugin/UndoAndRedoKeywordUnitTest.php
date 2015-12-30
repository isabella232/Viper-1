<?php

require_once 'AbstractViperImagePluginUnitTest.php';

class Viper_Tests_ViperReplacementPlugin_UndoAndRedoKeywordUnitTest extends AbstractViperImagePluginUnitTest
{

    /**
     * Test that keyword can be deleted.
     *
     * @return void
     */
    public function testUndoAndRedoDeletingKeywords()
    {
        // Using keyboard shortcuts
        $this->useTest(1);
        $this->clickKeyword(1);
        $this->moveToKeyword(1 , 'right');
        $this->sikuli->keyDown('Key.RIGHT');
        $this->sikuli->keyDown('Key.SHIFT + Key.RIGHT');
        $this->sikuli->keyDown('Key.DELETE');
        sleep(3);
        $this->sikuli->keyDown('Key.CMD + z');
        sleep(5);

        $this->assertHTMLMatch('<p>%1% ((prop:productName)) %2%</p><p>%3% %4%</p>');
        $this->assertRawHTMLMatch('<p>%1%<span data-viper-keyword="((prop:productName))" title="((prop:productName))">Viper</span> %2%</p><p>%3% %4%</p>');

        // Test for redo
        $this->clickKeyword(1);
        $this->sikuli->keyDown('Key.CMD + Key.SHIFT + z');

        $this->assertHTMLMatch('<p>%1%&nbsp;&nbsp;%2%</p><p>%3% %4%</p>');
        $this->assertRawHTMLMatch('<p>%1%  %2%</p><p>%3% %4%</p>');

        // Using top toolbar
        $this->clickTopToolbarButton('historyUndo', NULL);

        $this->assertHTMLMatch('<p>%1% ((prop:productName)) %2%</p><p>%3% %4%</p>');
        $this->assertRawHTMLMatch('<p>%1%<span data-viper-keyword="((prop:productName))" title="((prop:productName))">Viper</span> %2%</p><p>%3% %4%</p>');

        // Test for redo
        $this->clickTopToolbarButton('historyRedo', NULL);

        $this->assertHTMLMatch('<p>%1%&nbsp;&nbsp;%2%</p><p>%3% %4%</p>');
        $this->assertRawHTMLMatch('<p>%1%  %2%</p><p>%3% %4%</p>');

    }//end testUndoAndRedoDeletingKeywords()


    /**
     * Test that images using keywords can be undone and redone.
     *
     * @return void
     */
    public function testUndoAndRedoDeletingImageKeywords()
    {
        // Using keyboard shortcuts
        $this->useTest(2);
        $this->clickKeyword(1);
        sleep(1);
        $this->clickElement('img', 0);
        $this->sikuli->keyDown('Key.DELETE');
        $this->sikuli->keyDown('Key.CMD + z');

        $this->assertHTMLMatch('<p>%1% test content ((prop:viperKeyword)) </p><p>more content <img alt="TITLE" src="((prop:url))" /> even more %2% content</p>');
        $this->assertRawHTMLMatch('<p>%1% test content<span data-viper-keyword="((prop:viperKeyword))" title="((prop:viperKeyword))">%5%</span></p><p>more content<img alt="TITLE" data-viper-src="((prop:url))" src="'.$this->getTestURL('/Web/testImage.png').'" /> even more %2% content</p>');

        // Test for redo
        $this->clickKeyword(1);
        sleep(1);
        $this->sikuli->keyDown('Key.CMD + Key.SHIFT + z');

        $this->assertHTMLMatch('<p>%1% test content ((prop:viperKeyword))</p><p>more content&nbsp;&nbsp;even more %2% content</p>');
        $this->assertRawHTMLMatch('<p>%1% test content<span data-viper-keyword="((prop:viperKeyword))" title="((prop:viperKeyword))">%5%</span></p><p>more content  even more %2% content</p>');

        // Using top toolbar
        $this->clickTopToolbarButton('historyUndo', NULL);

        $this->assertHTMLMatch('<p>%1% test content ((prop:viperKeyword)) </p><p>more content <img alt="TITLE" src="((prop:url))" /> even more %2% content</p>');
        $this->assertRawHTMLMatch('<p>%1% test content<span data-viper-keyword="((prop:viperKeyword))" title="((prop:viperKeyword))">%5%</span></p><p>more content<img alt="TITLE" data-viper-src="((prop:url))" src="'.$this->getTestURL('/Web/testImage.png').'" /> even more %2% content</p>');


        // Test for redo
        $this->clickTopToolbarButton('historyRedo', NULL);

        $this->assertHTMLMatch('<p>%1% test content ((prop:viperKeyword))</p><p>more content&nbsp;&nbsp;even more %2% content</p>');
        $this->assertRawHTMLMatch('<p>%1% test content<span data-viper-keyword="((prop:viperKeyword))" title="((prop:viperKeyword))">%5%</span></p><p>more content  even more %2% content</p>');


    }//end testUndoAndRedoDeletingImageKeywords()


    /**
     * Test that images that use keywords that have been moved can be undone and redone using keyboard shortcuts.
     *
     * @return void
     */
    public function testUndoAndRedoMovingImageKeywordsUsingKeyboardShortcuts()
    {
        // Using keyboard shortcuts
        $this->useTest(2);
        sleep(1);
        $this->clickKeyword(2);
        sleep(3);
        $this->clickElement('img', 0);
        $this->clickInlineToolbarButton('move');
        $loc = $this->findKeyword(5);
        $this->sikuli->mouseMove($loc);
        $this->sikuli->mouseDown('Button.LEFT');
        usleep(300000);
        $this->sikuli->mouseUp('Button.LEFT');
        sleep(1);
        $this->sikuli->keyDown('Key.CMD + z');

        $this->assertHTMLMatch('<p>%1% test content ((prop:viperKeyword))</p><p>more content<img alt="TITLE" src="((prop:url))" /> even more %2% content</p>');
        $this->assertRawHTMLMatch('<p>%1% test content<span data-viper-keyword="((prop:viperKeyword))" title="((prop:viperKeyword))">%5%</span></p><p>more content<img alt="TITLE" data-viper-src="((prop:url))" src="'.$this->getTestURL('/Web/testImage.png').'" /> even more %2% content</p>');

        // Test for redo
        $this->clickKeyword(1);
        $this->sikuli->keyDown('Key.CMD + Key.SHIFT + z');
        sleep(2);
        $this->assertHTMLMatch('<p>%1% test content<img alt="TITLE" src="((prop:url))" /></p><p>more content&nbsp;&nbsp;even more %2% content</p>');
        $this->assertRawHTMLMatch('<p>%1% test content<img alt="TITLE" data-viper-src="((prop:url))" src="'.$this->getTestURL('/Web/testImage.png').'" /></p><p>more content  even more %2% content</p>');

    }//end testUndoAndRedoMovingImageKeywordsUsingKeyboardShortcuts()


    /**
     * Test that images that use keywords that have been moved can be undone and redone using toolbar icons.
     *
     * @return void
     */
    public function testUndoAndRedoMovingImageKeywordsUsingToolbarIcons()
    {

        // Using top toolbar
        $this->useTest(2);
        sleep(1);
        $this->clickKeyword(2);
        $this->clickElement('img', 0);
        $this->clickInlineToolbarButton('move');
        $loc = $this->findKeyword(5);
        $this->sikuli->mouseMove($loc);
        $this->sikuli->mouseDown('Button.LEFT');
        usleep(300000);
        $this->sikuli->mouseUp('Button.LEFT');
        $this->clickTopToolbarButton('historyUndo');

        $this->assertHTMLMatch('<p>%1% test content ((prop:viperKeyword))</p><p>more content<img alt="TITLE" src="((prop:url))" /> even more %2% content</p>');
        $this->assertRawHTMLMatch('<p>%1% test content<span data-viper-keyword="((prop:viperKeyword))" title="((prop:viperKeyword))">%5%</span></p><p>more content<img alt="TITLE" data-viper-src="((prop:url))" src="'.$this->getTestURL('/Web/testImage.png').'"> even more %2% content</p>');

        // Test for redo
        $this->clickKeyword(1);
        $this->clickTopToolbarButton('historyRedo', NULL);
        sleep(1);
        $this->assertHTMLMatch('<p>%1% test content<img alt="TITLE" src="((prop:url))" /></p><p>more content&nbsp;&nbsp;even more %2% content</p>');
        $this->assertRawHTMLMatch('<p>%1% test content<img alt="TITLE" data-viper-src="((prop:url))" src="'.$this->getTestURL('/Web/testImage.png').'"></p><p>more content  even more %2% content</p>');

    }//end testUndoAndRedoMovingImageKeywordsUsingToolbarIcons()


    /**
     * Test that images that use keywords that have been resized can be undone and redone.
     *
     * @return void
     */
    public function testUndoAndRedoResizingImageKeywords()
    {
        // Using keyboard shortcuts
        $this->useTest(2);
        $this->clickKeyword(1);
        sleep(1);
        $this->clickElement('img', 0);
        sleep(1);
        $this->resizeImage(200);
        sleep(1);
        $this->sikuli->keyDown('Key.CMD + z');

        $this->assertHTMLMatch('<p>%1% test content ((prop:viperKeyword))</p><p>more content <img src="((prop:url))" alt="TITLE" /> even more %2% content</p>');
        $this->assertRawHTMLMatch('<p>%1% test content<span data-viper-keyword="((prop:viperKeyword))" title="((prop:viperKeyword))">%5%</span></p><p>more content<img alt="TITLE" data-viper-src="((prop:url))" src="'.$this->getTestURL('/Web/testImage.png').'"> even more %2% content</p>');

        // Test for redo
        $this->clickKeyword(1);
        $this->sikuli->keyDown('Key.CMD + Key.SHIFT + z');

        $this->assertHTMLMatch('<p>%1% test content ((prop:viperKeyword))</p><p>more content <img src="((prop:url))" alt="TITLE" height="170" width="200" /> even more %2% content</p>');
        $this->assertRawHTMLMatch('<p>%1% test content<span data-viper-keyword="((prop:viperKeyword))" title="((prop:viperKeyword))">%5%</span></p><p>more content<img alt="TITLE" data-viper-src="((prop:url))" height="170px" src="'.$this->getTestURL('/Web/testImage.png').'" width="200px"> even more %2% content</p>');

        // Using top toolbar
        sleep(1);
        $this->clickTopToolbarButton('historyUndo');
        $this->clickElement('img', 0);
        $this->resizeImage(200);
        sleep(1);
        $this->clickTopToolbarButton('historyUndo', NULL);

        $this->assertHTMLMatch('<p>%1% test content ((prop:viperKeyword))</p><p>more content<img alt="TITLE" src="((prop:url))" /> even more %2% content</p>');
        $this->assertRawHTMLMatch('<p>%1% test content<span data-viper-keyword="((prop:viperKeyword))" title="((prop:viperKeyword))">%5%</span></p><p>more content<img alt="TITLE" data-viper-src="((prop:url))" src="'.$this->getTestURL('/Web/testImage.png').'"> even more %2% content</p>');

        // Test for redo
        $this->clickTopToolbarButton('historyRedo', NULL);

        $this->assertHTMLMatch('<p>%1% test content ((prop:viperKeyword))</p><p>more content <img src="((prop:url))" alt="TITLE" height="170" width="200" /> even more %2% content</p>');
        $this->assertRawHTMLMatch('<p>%1% test content<span data-viper-keyword="((prop:viperKeyword))" title="((prop:viperKeyword))">%5%</span></p><p>more content<img alt="TITLE" data-viper-src="((prop:url))" height="170px" src="'.$this->getTestURL('/Web/testImage.png').'" width="200px"> even more %2% content</p>');

    }//end testUndoAndRedoResizingImageKeywords()


    /**
     * Test that keywords that have have links added can be undone and redone.
     *
     * @return void
     */
    public function testUndoAndRedoOnLinkedKeywords()
    {
        // Test using keyboard shortcuts
        $this->useTest(3);
        $this->moveToKeyword(1 , 'right');
        $this->sikuli->keyDown('Key.RIGHT');
        $this->sikuli->keyDown('Key.SHIFT + Key.RIGHT');
        sleep(1);
        $this->clickTopToolbarButton('linkremove', NULL);
        $this->sikuli->keyDown('Key.CMD + z');

        $this->assertHTMLMatch('<p>%1% <a href="www.squizlabs.com.au">((prop:productName))</a> %2%</p><p>%3% %4%</p>');
        $this->assertRawHTMLMatch('<p>%1%<a href="www.squizlabs.com.au"><span data-viper-keyword="((prop:productName))" title="((prop:productName))">Viper</span></a> %2%</p><p>%3% %4%</p>');

        // Test for redo
        $this->clickKeyword(1);
        $this->sikuli->keyDown('Key.CMD + Key.SHIFT + z');
        $this->assertHTMLMatch('<p>%1% ((prop:productName)) %2%</p><p>%3% %4%</p>');
        $this->assertRawHTMLMatch('<p>%1%<span data-viper-keyword="((prop:productName))" title="((prop:productName))">Viper</span> %2%</p><p>%3% %4%</p>');

        // Test using top toolbar
        $this->clickTopToolbarButton('historyUndo', NULL);

        $this->assertHTMLMatch('<p>%1% <a href="www.squizlabs.com.au">((prop:productName))</a> %2%</p><p>%3% %4%</p>');
        $this->assertRawHTMLMatch('<p>%1%<a href="www.squizlabs.com.au"><span data-viper-keyword="((prop:productName))" title="((prop:productName))">Viper</span></a> %2%</p><p>%3% %4%</p>');

        // Test for redo
        $this->clickTopToolbarButton('historyRedo', NULL);

        $this->assertHTMLMatch('<p>%1% ((prop:productName)) %2%</p><p>%3% %4%</p>');
        $this->assertRawHTMLMatch('<p>%1%<span data-viper-keyword="((prop:productName))" title="((prop:productName))">Viper</span> %2%</p><p>%3% %4%</p>');

    }//end testUndoAndRedoOnLinkedKeywords()
}
